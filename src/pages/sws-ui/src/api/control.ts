import { API } from "./api";
import { awaiter } from "../utils/awaiter";
import {
  TrackingModes,
  MountStatus,
  MaxSlewSpeed,
  Direction,
  ValidMountStatus,
  MountWithCompensation,
  mountHasCompensation,
  Mount,
} from "../types";

import {
  acceptAlignmentCommand,
  buildBuzzerCommand,
  buildDateUpdateCommands,
  buildGoToCommand,
  buildLocationCommand,
  buildMaxSlewSpeedCommand,
  buildMerdianAutoFlipCommand,
  buildMeridianPauseAtHomeCommand,
  buildMountUpdateCommand,
  buildRateTrackingCompCommand,
  buildSlewCommand,
  buildSpeedCommand,
  buildStartAlignmentCommand,
  buildTrackingRateCommand,
  buildTrackingTypeCommand,
  continueGoToCommand,
  doMeridianFlipCommand,
  estopCommand,
  goHomeCommand,
  parkCommand,
  setMeridianAutoFlipNowCommand,
  setNewHomeCommand,
  setParkingLocationCommand,
  startTrackingCommand,
  stopTrackingCommand,
  syncCommand,
  TrackingRateAdjustment,
  unparkCommand,
} from "../onstep/commands";

import { Star } from "../utils/stars";
import { objectsEqual } from "../utils/compareObjects";
import { Mutex } from "async-mutex";
import { Commander } from "./commander";
import { Status } from "./status";
import { Search } from "./search";

export class MountControl {
  private heartbeat?: number;
  private onStatus?: (status: MountStatus) => void;
  private status?: MountStatus;
  private mutex;
  private commander;
  private _status;
  private _onAfterGoto?: () => void;

  constructor(private api: API, private onError: (error: string) => void) {
    this.mutex = new Mutex();
    this.commander = new Commander(api, onError);
    this._status = new Status(this.commander);
  }

  public get commandLogs() {
    return this.commander.commandLogs;
  }

  public clearLogs() {
    this.commander.commandLogs = [];
  }

  makeSearcher() {
    return new Search(this.commander);
  }

  onAfterGoto(fn: () => void) {
    this._onAfterGoto = fn;
    return this;
  }

  startHeartbeat(
    onStatus: (status: MountStatus) => void,
    onLoading?: (loading: boolean) => void
  ) {
    if (this.heartbeat) {
      throw new Error("Heartbeat is already ticking.");
    }

    this.onStatus = onStatus;

    this.heartbeat = setInterval(
      () => this.getStatus(onLoading),
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

  private async getStatus(onLoading?: (loading: boolean) => void) {
    onLoading?.(true);

    await this.mutex.runExclusive(async () => {
      this.status = await this._status.getStatus();

      if (this.status.lastError) {
        this.onError(`A background error occured! ${this.status.lastError}`);
      }

      this.onStatus?.(this.status);
      onLoading?.(false);
    });
  }

  slew(dir: Direction, startStop: boolean) {
    return this.sendCommand(buildSlewCommand(dir, startStop));
  }

  async updateMountSettings(mount: Mount) {
    const { compareStatus, commands } = buildMountUpdateCommand(mount);

    await this.sendCommands(commands);

    await this.waitForStatus({
      test: (status) => compareStatus(status.mount),
      error: `Failed to update mount settings`,
    });
  }

  async setLocation(location: ValidMountStatus["location"]) {
    await this.sendCommands({
      long: buildLocationCommand(
        "long",
        location.long,
        this.mountSupports("locationSeconds")
      ),
      lat: buildLocationCommand(
        "lat",
        location.lat,
        this.mountSupports("locationSeconds")
      ),
    });

    await this.waitForStatus({
      test: (status) => objectsEqual(status.location, location),
      maxSeconds: 5,
      error: `Failed to update location`,
    });
  }

  async setDateTime(offset?: string) {
    await this.sendCommands(buildDateUpdateCommands(offset));

    await this.waitForStatus({
      test: (status) => !status.dateTime.datesAreOutOfSync,
      maxSeconds: 5,
      error: `The date/time still appears to be out of sync.`,
    });
  }

  async setNewHome() {
    await this.sendCommand(setNewHomeCommand);
    await this.getStatus();
  }

  async goHome() {
    await this.sendCommand(goHomeCommand);

    await this.waitForStatus({
      test: (status) => {
        return status.status.slewing || status.status.home;
      },
      maxSeconds: 5,
      error: `Failed to start homing`,
    });

    await this.waitForStatus({
      test: (status) => {
        return status.status.home;
      },
      error: "Failed to go home",
      maxSeconds: 100,
    });
  }

  async doMeridianFlip() {
    await this.sendCommand(doMeridianFlipCommand);
    await this.getStatus();
  }

  async setMeridianAutoFlipNow() {
    await this.sendCommand(setMeridianAutoFlipNowCommand);
  }

  async setMeridianAutoFlip(enable: boolean) {
    await this.sendCommand(buildMerdianAutoFlipCommand(enable));
    await this.waitForStatus({
      test: (status) =>
        status.mount.type === "gem" && status.mount.auto_meridian === enable,
      maxSeconds: 5,
      error: `Failed to ${enable ? "enable" : "disable"} meridian flip`,
    });
  }

  async setMeridianPauseAtHome(enable: boolean) {
    await this.sendCommand(buildMeridianPauseAtHomeCommand(enable));

    await this.waitForStatus({
      test: (status) =>
        status.mount.type === "gem" && status.mount.pause_at_home === enable,
      maxSeconds: 5,
      error: `Failed to ${enable ? "enable" : "disable"} auto pause at home`,
    });
  }

  async setBuzzer(enable: boolean) {
    await this.sendCommand(buildBuzzerCommand(enable));
    await this.waitForStatus({
      test: (status) => status.features.buzzer === enable,
      maxSeconds: 5,
      error: `Failed to change buzzer status`,
    });
  }

  async changeSpeed(speed: number) {
    await this.sendCommand(buildSpeedCommand(speed));
    await this.getStatus();
  }

  async changeMaxSlewSpeed(speed: MaxSlewSpeed) {
    await this.sendCommand(buildMaxSlewSpeedCommand(speed));

    await this.waitForStatus({
      test: (status) => status.slewing.maxSpeed === speed,
      maxSeconds: 5,
      error: `Failed to change slewing speed to ${speed}`,
    });
  }

  async setTrackingRateComp(
    rate: MountWithCompensation["rate_comp_type"],
    axes: MountWithCompensation["rate_comp_axes"]
  ) {
    const { commands, expectedRateComp } = buildRateTrackingCompCommand(
      rate,
      axes
    );
    await this.sendCommands(commands);

    await this.waitForStatus({
      test: (status) => {
        const mount = status.mount;

        if (!mountHasCompensation(mount)) {
          return false;
        }

        return mount.rate_comp === expectedRateComp;
      },
      error: "Failed to update mount tracking status",
    });
  }

  async syncWith() {
    await this.sendCommand(syncCommand);
  }

  async startTracking() {
    await this.unPark();

    await this.sendCommand(startTrackingCommand);

    await this.waitForStatus({
      test: ({ status }) => status.tracking,
      error: "Failed to start tracking.",
    });
  }

  async adjustTrackingRate(type: TrackingRateAdjustment) {
    await this.sendCommand(buildTrackingRateCommand(type));
  }

  async continueGoTo() {
    await this.sendCommand(continueGoToCommand);

    await this.waitForStatus({
      test: (status) => !status.status.waitingAtHome,
      error: `Failed to continue GoTo`,
    });
  }

  /**
   * TODO: it would be nice to be able to store the star name in the firmware
   * somewhere so that we could show the user "going to star xyz"
   */
  async goToStar(star: Star) {
    const { moveTelescopeCommand } = await this.sendCommands(
      buildGoToCommand(star)
    );

    const moveResult = String(moveTelescopeCommand);

    if (moveResult !== "0") {
      const message =
        {
          // error messages taken from source code
          "1": "the target is below the horizon limit",
          "2": "the target is above the overhead limit",
          "3": "the controller is in standby",
          "4": "the mount is parked",
          "5": "a GoTo already in progress",
          "6": "the move is outside the mount limits",
          "7": "there was a hardware fault",
          "8": "the mount is already in motion",
        }[moveResult] ?? `an unknown error occured ${moveResult}`;

      this.onError(`An error occured: ${message}.`);
      return;
    }

    await this.waitForStatus({
      test: (status) => status.status.slewing,
      maxSeconds: 15,
      error: `Failed to initiate GoTo`,
    });

    this._onAfterGoto?.();
    this._onAfterGoto = undefined;
  }

  async sendCommands<T extends string>(cmds: Record<T, string>) {
    return this.commander.sendCommands(cmds);
  }

  async sendCommand(cmd: string, system = true) {
    return this.commander.sendCommand(cmd, system);
  }

  async stopTracking() {
    await this.sendCommand(stopTrackingCommand);
    await this.waitForStatus({
      test: ({ status }) => !status.tracking,
      error: "Failed to stop tracking.",
    });
  }

  async startAlignment(stars: number) {
    await this.sendCommand(buildStartAlignmentCommand(stars));
    await this.waitForStatus({
      test: (status) => status.status.aligning,
      error: "Failed to start alignment",
    });
  }

  async nextStarAlignment() {
    const status = this.getValidStatus();
    const currentStar = status.alignment.currentStar;

    await this.syncWith();

    await this.waitForStatus({
      test: (status) => status.alignment.currentStar !== currentStar,
      error: "Failed to start next star alignment",
    });
  }

  async acceptAlignment() {
    await this.sendCommand(acceptAlignmentCommand);
    await this.waitForStatus({
      test: (status) => !status.status.aligning,
      error: "Failed to accept alignment",
    });
  }

  async setParkingLocation() {
    await this.sendCommand(setParkingLocationCommand);
    await this.getStatus();
  }

  async park() {
    await this.sendCommand(parkCommand);

    await this.waitForStatus({
      test: ({ status }) => {
        return status.slewing;
      },
      maxSeconds: 5,
      error: `Failed to start parking`,
    });

    await this.waitForStatus({
      test: ({ status }) => {
        return status.parked;
      },
      error: `Failed to park`,
    });
  }

  async unPark() {
    await this.sendCommand(unparkCommand);
    await this.waitForStatus({
      test: ({ status }) => !status.parked,
      maxSeconds: 5,
      error: `Failed to unpark`,
    });
  }

  async changeTrackingType(mode: TrackingModes) {
    await this.sendCommand(buildTrackingTypeCommand(mode));
    await this.getStatus();
  }

  async estop() {
    await this.sendCommand(estopCommand);
    this.onError(
      "An E-Stop command has been sent to the mount. Hope everything's ok."
    );
  }

  private waitForStatus(params: {
    test: (status: ValidMountStatus) => boolean;
    maxSeconds?: number;
    error: string;
    onTimeout?: () => void;
  }) {
    return awaiter({
      test: () => {
        const status = this.status;

        if (status?.type !== "valid") {
          return false;
        }

        return params.test(status);
      },
      maxSeconds: params.maxSeconds ?? 10,
      onTimeout: (secs) => {
        this.onError(`${params.error} after ${secs} seconds.`);
        params.onTimeout?.();
      },
    });
  }

  private getMountVersion() {
    const status = this.getValidStatus();

    const [__, major, minor, patch] = status.version.onstep
      .match(/(\d+)\.(\d+)([a-z]+)/i)!
      .map((i) => {
        if (i.match(/^\d+$/)) {
          return parseInt(i);
        }
        return i;
      }) as [string, number, number, string];
    return { major, minor, patch };
  }

  private mountSupports(feature: "locationSeconds") {
    const { major } = this.getMountVersion();

    switch (feature) {
      case "locationSeconds":
        return major > 3;
    }
  }

  private getValidStatus() {
    if (this.status?.type !== "valid") {
      throw new Error("Attempted to get valid status.");
    }

    return this.status;
  }
}
