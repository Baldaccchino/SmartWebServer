import { awaiter } from "../utils/awaiter";
import {
  TrackingModes,
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
} from "./commands/onstepCommands";
import { Star } from "../database";
import { objectsEqual } from "../utils/compareObjects";
import type { OnStep } from "./onStep";

export class MountControl {
  private _onAfterGoto?: () => void;

  constructor(
    private onStep: OnStep,
    private onError: (error: string) => void
  ) {}

  public get commandLogs() {
    return this.onStep.commandLogs;
  }

  public clearLogs() {
    this.onStep.commandLogs = [];
  }
  onAfterGoto(fn: () => void) {
    this._onAfterGoto = fn;
    return this;
  }

  private refreshStatus() {
    return this.onStep.refreshStatus();
  }

  private get status() {
    return this.onStep.status;
  }

  slew(dirs: Direction[], startStop: boolean) {
    return this.onStep.sendCommandArray(
      dirs.map((d) => buildSlewCommand(d, startStop))
    );
  }

  async updateMountSettings(mount: Mount) {
    const { compareStatus, commands } = buildMountUpdateCommand(mount);

    await this.onStep.sendCommands(commands);

    await this.waitForStatus({
      test: (status) => compareStatus(status.mount),
      error: `Failed to update mount settings`,
    });
  }

  async setLocation(location: ValidMountStatus["location"]) {
    await this.onStep.sendCommands({
      long: buildLocationCommand(
        "long",
        location.long,
        this.onStep.mountSupports("locationSeconds")
      ),
      lat: buildLocationCommand(
        "lat",
        location.lat,
        this.onStep.mountSupports("locationSeconds")
      ),
    });

    await this.waitForStatus({
      test: (status) => objectsEqual(status.location, location),
      maxSeconds: 5,
      error: `Failed to update location`,
    });
  }

  async setDateTime(offset?: string) {
    await this.onStep.sendCommands(buildDateUpdateCommands(offset));

    await this.waitForStatus({
      test: (status) => !status.dateTime.datesAreOutOfSync,
      maxSeconds: 5,
      error: `The date/time still appears to be out of sync.`,
    });
  }

  async setNewHome() {
    await this.onStep.sendCommand(setNewHomeCommand);
    await this.refreshStatus();
  }

  async goHome() {
    await this.onStep.sendCommand(goHomeCommand);

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
    await this.onStep.sendCommand(doMeridianFlipCommand);
    await this.refreshStatus();
  }

  async setMeridianAutoFlipNow() {
    await this.onStep.sendCommand(setMeridianAutoFlipNowCommand);
  }

  async setMeridianAutoFlip(enable: boolean) {
    await this.onStep.sendCommand(buildMerdianAutoFlipCommand(enable));
    await this.waitForStatus({
      test: (status) =>
        status.mount.type === "gem" && status.mount.auto_meridian === enable,
      maxSeconds: 5,
      error: `Failed to ${enable ? "enable" : "disable"} meridian flip`,
    });
  }

  async setMeridianPauseAtHome(enable: boolean) {
    await this.onStep.sendCommand(buildMeridianPauseAtHomeCommand(enable));

    await this.waitForStatus({
      test: (status) =>
        status.mount.type === "gem" && status.mount.pause_at_home === enable,
      maxSeconds: 5,
      error: `Failed to ${enable ? "enable" : "disable"} auto pause at home`,
    });
  }

  async setBuzzer(enable: boolean) {
    await this.onStep.sendCommand(buildBuzzerCommand(enable));
    await this.waitForStatus({
      test: (status) => status.features.buzzer === enable,
      maxSeconds: 5,
      error: `Failed to change buzzer status`,
    });
  }

  async changeSpeed(speed: number) {
    await this.onStep.sendCommand(buildSpeedCommand(speed));
    await this.refreshStatus();
  }

  async changeMaxSlewSpeed(speed: MaxSlewSpeed) {
    await this.onStep.sendCommand(buildMaxSlewSpeedCommand(speed));

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
    await this.onStep.sendCommands(commands);

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
    await this.onStep.sendCommand(syncCommand);
  }

  async startTracking() {
    await this.unPark();

    await this.onStep.sendCommand(startTrackingCommand);

    await this.waitForStatus({
      test: ({ status }) => status.tracking,
      error: "Failed to start tracking.",
    });
  }

  async adjustTrackingRate(type: TrackingRateAdjustment) {
    await this.onStep.sendCommand(buildTrackingRateCommand(type));
  }

  async continueGoTo() {
    await this.onStep.sendCommand(continueGoToCommand);

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
    const { moveTelescopeCommand } = await this.onStep.sendCommands(
      buildGoToCommand(star)
    );

    const moveResult = moveTelescopeCommand;

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
  }

  async sendCommand(cmd: string) {
    return this.onStep.sendCommand(cmd, "log");
  }

  async stopTracking() {
    await this.onStep.sendCommand(stopTrackingCommand);
    await this.waitForStatus({
      test: ({ status }) => !status.tracking,
      error: "Failed to stop tracking.",
    });
  }

  async startAlignment(stars: number) {
    await this.onStep.sendCommand(buildStartAlignmentCommand(stars));
    await this.waitForStatus({
      test: (status) => status.status.aligning,
      error: "Failed to start alignment",
    });
  }

  async nextStarAlignment() {
    const status = this.onStep.getValidStatus();
    const currentStar = status.alignment.currentStar;

    await this.syncWith();

    await this.waitForStatus({
      test: (status) => status.alignment.currentStar !== currentStar,
      error: "Failed to start next star alignment",
    });
  }

  async acceptAlignment() {
    await this.onStep.sendCommand(acceptAlignmentCommand);
    await this.waitForStatus({
      test: (status) => !status.status.aligning,
      error: "Failed to accept alignment",
    });
  }

  async setParkingLocation() {
    await this.onStep.sendCommand(setParkingLocationCommand);
    await this.refreshStatus();
  }

  async park() {
    await this.onStep.sendCommand(parkCommand);

    await this.waitForStatus({
      test: ({ status }) => {
        return status.slewing || status.parked;
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
    await this.onStep.sendCommand(unparkCommand);
    await this.waitForStatus({
      test: ({ status }) => !status.parked,
      maxSeconds: 5,
      error: `Failed to unpark`,
    });
  }

  async changeTrackingType(mode: TrackingModes) {
    await this.onStep.sendCommand(buildTrackingTypeCommand(mode));
    await this.refreshStatus();
  }

  async estop() {
    await this.onStep.sendCommand(estopCommand);
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
}
