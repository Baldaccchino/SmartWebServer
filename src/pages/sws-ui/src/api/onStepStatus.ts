import { ref } from "vue";
import type { OnStep } from "./onStep";
import type { Mount, MountStatus, RateComp } from "../types";
import { statusCommands } from "../onstep/commands";
import {
  charExists,
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
import { Driver, Focuser, updateResources } from "./drivers";

async function fetchStatus(commander: OnStep) {
  const { isValid } = await commander.sendCommands(
    { isValid: ":GVP#" },
    "nolog"
  );

  if (isValid !== "On-Step") {
    return {
      type: "invalid" as const,
      lastError: false as const,
    };
  }

  const response = await commander.sendCommands(statusCommands, "nolog");

  return {
    type: "valid" as const,
    test: (char: string) => charExists(response.mountStatus, char),
    response,
  };
}

type StatusFetchResponse = Awaited<ReturnType<typeof fetchStatus>>;

function getMountStatus(response: StatusFetchResponse): Mount {
  if (response.type !== "valid") {
    throw new Error("Attempted to get mount on invalid.");
  }

  const { backlashRa, backlashDec, minAlt, maxAlt, degPastMerE, degPastMerW } =
    response.response;

  const { test } = response;

  const mountType = test("E")
    ? "gem"
    : test("K")
    ? "fork"
    : test("k")
    ? "fork_alt"
    : test("A")
    ? "alt_az"
    : "unknown";

  let rateCompValue: RateComp = "none";

  if (test("r")) {
    if (test("s")) {
      rateCompValue = "refr_ra";
    } else {
      rateCompValue = "refr_both";
    }
  } else {
    if (test("t")) {
      if (test("s")) {
        rateCompValue = "full_ra";
      } else {
        rateCompValue = "full_both";
      }
    }
  }

  const rateComp = {
    rate_comp: rateCompValue,
    rate_comp_type:
      rateCompValue === "none"
        ? "none"
        : ["full_ra", "full_both"].includes(rateCompValue)
        ? "full"
        : "refraction_only",
    rate_comp_axes: ["refr_both", "full_both"].includes(rateCompValue)
      ? "dual"
      : "single",
  } as const;

  const baseMount = {
    backlash_ra: backlashRa,
    backlash_dec: backlashDec,
    min_alt: minAlt.replace(/\*/g, ""),
    max_alt: maxAlt.replace(/\*/g, ""),
  } as const;

  switch (mountType) {
    case "gem":
      return {
        type: "gem",
        auto_meridian: test("a"),
        pause_at_home: test("u"),
        deg_past_mer_e: degPastMerE,
        deg_past_mer_w: degPastMerW,
        ...rateComp,
        ...baseMount,
      };

    case "alt_az":
      return {
        type: "alt_az",
        ...baseMount,
      };
  }

  return {
    type: mountType,
    ...rateComp,
    ...baseMount,
  };
}

export class OnStepStatus {
  #onStep;
  private heartbeat?: number;
  private drivers?: Driver[];
  private focusers?: Focuser[];
  private swsVersion = "?";
  private _status;
  constructor(onStep: OnStep, private onStatus: (status: MountStatus) => void) {
    this.#onStep = onStep;
    this._status = ref<MountStatus | undefined>(undefined);
  }

  async getFocusersStatus() {
    if (this.focusers) {
      return;
    }

    this.focusers = times(6).map((i) => new Focuser(i));

    await updateResources(this.#onStep, this.focusers);
  }

  get status() {
    return this._status.value;
  }

  setSwsVersion(v: string) {
    this.swsVersion = v;
    return this;
  }

  private async getDriverStatus() {
    if (!this.drivers) {
      this.drivers = times(9).map((i) => new Driver(i));
    }

    await updateResources(this.#onStep, this.drivers);
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
    this._status.value = await this.getStatus();
    this.onStatus(this._status.value);
  }

  private async getStatus(): Promise<MountStatus> {
    const response = await fetchStatus(this.#onStep);

    if (response.type === "invalid") {
      return response;
    }

    const {
      test,
      response: {
        onstepFirmware,
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

    await this.getDriverStatus();
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
        onstep: onstepFirmware,
        wifi: this.swsVersion,
      },
    };
  }
}
