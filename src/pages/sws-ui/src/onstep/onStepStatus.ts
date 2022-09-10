import { ref } from "vue";
import type { OnStep } from "./onStep";
import type { Axis, MountStatus } from "../types";
import {
  getTrackSpeed,
  getTrackingMode,
  getBasicStatus,
  getDateTime,
  getGuideRate,
  getLastError,
  getLocation,
  getAlignment,
} from "./statusUtils";
import { times } from "../utils/compareObjects";
import { AxisDriver } from "./drivers";
import { updateResources } from "./queryable";
import { Focuser } from "./focuser";
import { fetchStatus, getMountStatus } from "./fetchStatus";

export type MountFeatures = "locationSeconds" | "sixFocusers" | "nineAxes";

export class OnStepStatus {
  #onStep;
  private heartbeat?: number;
  private axes?: AxisDriver[];
  private focusers?: Focuser[];
  private swsVersion = "?";
  private onstepVersion = "?";
  private _status?: MountStatus;
  constructor(onStep: OnStep, private onStatus: (status: MountStatus) => void) {
    this.#onStep = onStep;
  }

  getValidStatus() {
    if (this.status?.type !== "valid") {
      throw new Error("Attempted to get valid status.");
    }

    return this.status;
  }

  getMountVersion() {
    const version = this.onstepVersion;

    if (version === "?") {
      return {
        major: -1,
        minor: -1,
        patch: -1,
      };
    }

    const [__, major, minor, patch] = version
      .match(/(\d+)\.(\d+)([a-z]+)/i)!
      .map((i) => {
        if (i.match(/^\d+$/)) {
          return parseInt(i);
        }
        return i;
      }) as [string, number, number, string];
    return { major, minor, patch };
  }

  mountSupports(feature: MountFeatures): boolean {
    const { major } = this.getMountVersion();

    switch (feature) {
      case "locationSeconds":
        return major > 3;
      case "sixFocusers":
      case "nineAxes":
        return major >= 10;
    }
  }

  async getFocusersStatus() {
    // we only need to scan the focusers the first time around.
    if (this.focusers) {
      return;
    }

    const supportsSixFocusers = this.mountSupports("sixFocusers");
    const numFocusers = supportsSixFocusers ? 6 : 2;

    this.focusers = times(numFocusers).map(
      (i) => new Focuser(i, supportsSixFocusers)
    );

    await updateResources(this.#onStep, this.focusers);
  }

  get status() {
    return this._status;
  }

  setSwsVersion(v: string) {
    this.swsVersion = v;
    return this;
  }

  private async updateAxesStatus() {
    if (!this.axes) {
      const supportsNineAxes = this.mountSupports("nineAxes");

      this.axes = times(supportsNineAxes ? 9 : 2).map((i) => new AxisDriver(i));
    }

    await updateResources(this.#onStep, this.axes);
  }

  startHeartbeat() {
    if (this.heartbeat) {
      throw new Error("Heartbeat is already ticking.");
    }

    this.heartbeat = setInterval(
      () => this.refreshStatus(),
      4000
    ) as any as number;
    return this;
  }

  stopHeartbeat() {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = undefined;
    }
  }

  async refreshStatus() {
    this._status = await this.getStatus();
    this.onStatus(this._status);
  }

  private async getStatus(): Promise<MountStatus> {
    const response = await fetchStatus(this.#onStep);

    if (response.type === "invalid") {
      return response;
    }

    const {
      test,
      response: {
        onstepVersion,
        raCurrent,
        decCurrent,
        raTarget,
        decTarget,
        siteLong,
        siteLat,
        alignStars,
        trackingType,
        nominalRate,
        currentRate,
        mountStatus,
        utcDate,
        utcTime,
        utcOffset,
      },
    } = response;

    this.onstepVersion = onstepVersion;

    const trackSpeed = getTrackSpeed(currentRate, nominalRate);
    const trackType = getTrackingMode(parseFloat(trackingType));
    const status = getBasicStatus(test);
    const dateTime = getDateTime(utcDate, utcTime, utcOffset);
    const guideRate = getGuideRate(mountStatus);
    const lastError = getLastError(mountStatus);

    const aligning =
      alignStars.length === 3 &&
      alignStars[1] <= alignStars[2] &&
      alignStars[1] !== "0";

    await this.updateAxesStatus();
    await this.getFocusersStatus();

    return {
      type: "valid",
      lastError,
      location: {
        lat: getLocation(siteLat),
        long: getLocation(siteLong),
      },
      mount: getMountStatus(response),
      position: {
        current: {
          ra: raCurrent,
          dec: decCurrent,
        },
        target: {
          ra: raTarget,
          dec: decTarget,
        },
      },
      dateTime,
      alignment: getAlignment(alignStars),
      status: {
        tracking: status.tracking,
        parked: status.parked,
        parkFail: status.parkFail,
        slewing: status.slewing,
        home: status.home,
        aligning,
        waitingAtHome: status.waitingAtHome,
      },
      slewing: {
        maxSpeed: trackSpeed,
        speed: guideRate,
      },
      features: {
        buzzer: status.buzzerEnabled,
      },
      tracking: {
        type: trackType,
      },
      version: {
        onstep: onstepVersion,
        wifi: this.swsVersion,
      },
      axes: (this.axes ?? [])
        .filter((d) => !!d.status)
        .filter((d) => !d.disabled)
        // casted to axis since typescript doesn't pick up on the filter above.
        .map((d) => d.status as Axis),
    };
  }
}
