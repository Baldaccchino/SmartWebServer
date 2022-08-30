import { signed, num } from "../utils/num";
import type {
  Coordinate,
  Direction,
  MaxSlewSpeed,
  Mount,
  MountWithCompensation,
  TrackingModes,
} from "../types";
import { Star } from "../utils/stars";
import { objectsEqual } from "../utils/compareObjects";

export type TrackingRateAdjustment = "faster" | "slower" | "reset";
export const setNewHomeCommand = ":hF#";
export const goHomeCommand = ":hC#";
export const doMeridianFlipCommand = ":SX99,1#";
export const setMeridianAutoFlipNowCommand = ":MA#";
export const startTrackingCommand = ":Te#";
export const continueGoToCommand = ":SX99,1#";
export const moveTelescopeCommand = ":MS#";
export const stopTrackingCommand = ":Td#";
export const acceptAlignmentCommand = ":A+#";
export const setParkingLocationCommand = ":hQ#";
export const parkCommand = ":hP#";
export const unparkCommand = ":hR#";
export const estopCommand = ":Q#";
export const syncCommand = ":CS#";
export const onstepFirmwareCommand = ":GVN#";
export const mountStatusCommand = ":GU#";
export const raCurrentCommand = ":GR#";
export const decCurrentCommand = ":GD#";
export const raTargetCommand = ":Gr#";
export const decTargetCommand = ":Gd#";
export const trackingTypeCommand = ":GT#";
export const siteLongCommand = ":GgH#";
export const siteLatCommand = ":GtH#";
export const alignStarsCommand = ":A?#";
export const nominalRateCommand = ":GX92#";
export const currentRateCommand = ":GX93#";
export const utcDateCommand = ":GX81#";
export const utcTimeCommand = ":GX80#";
export const utcOffsetCommand = ":GG#";
export const siderealTimeCommand = ":GS#";
export const localTimeCommand = ":GL#";
export const slewRateCommand = ":GX97#";
export const minAltCommand = ":Gh#";
export const maxAltCommand = ":Go#";
export const backlashRaCommand = ":%BR#";
export const backlashDecCommand = ":%BD#";
export const degPastMeridianECommand = ":GXE9#";
export const degPastMeridianWCommand = ":GXEA#";
export const meridianStatusCommand = ":GX94#";

export function buildSlewCommand(dir: Direction, startStop: boolean) {
  return `:${startStop ? "M" : "Q"}${dir}#`;
}
export function buildMountUpdateCommand(mount: Mount) {
  const commands: string[] = [];

  const compareKeys: string[] = [
    "max_alt",
    "min_alt",
    "backlash_ra",
    "backlash_dec",
  ];

  commands.push(
    ...[
      `:So${mount.max_alt}#`,
      `:Sh${mount.min_alt}#`,
      `:$BR${mount.backlash_ra}#`,
      `:$BD${mount.backlash_dec}#`,
    ]
  );

  if (mount.type === "gem") {
    commands.push(
      ...[`:SXE9,${mount.deg_past_mer_e}#`, `:SXEA,${mount.deg_past_mer_e}#`]
    );
    compareKeys.push(...["deg_past_mer_e", "deg_past_mer_w"]);
  }

  const expectedStatus = Object.fromEntries(
    compareKeys.map((k) => [k, mount[k as keyof typeof mount]])
  );

  return {
    commands: Object.fromEntries(commands.map((c, i) => [i, c])),
    compareStatus: (mount: Mount) => {
      return objectsEqual(
        Object.fromEntries(
          compareKeys.map((k) => [k, mount[k as keyof typeof mount]])
        ),
        expectedStatus
      );
    },
  };
}

export function buildTrackingTypeCommand(mode: TrackingModes) {
  const dr = {
    sidereal: "Q",
    lunar: "L",
    solar: "S",
    king: "K",
  }[mode];

  return `:T${dr}#`;
}

export function buildStartAlignmentCommand(stars: number) {
  return `:A${stars}#`;
}
export function buildGoToCommand(star: Star): Record<string, string> {
  return { ra: `:Sr${star.ra}#`, dec: `:Sd${star.dec}#`, moveTelescopeCommand };
}
export function buildTrackingRateCommand(type: TrackingRateAdjustment) {
  return {
    faster: ":T+#",
    slower: ":T-#",
    reset: ":TR#",
  }[type];
}
export function buildMerdianAutoFlipCommand(enable: boolean) {
  return `:SX95,${enable ? 1 : 0}#`;
}
export function buildMeridianPauseAtHomeCommand(enable: boolean) {
  return `:SX98,${enable ? 1 : 0}#`;
}

export function buildBuzzerCommand(enable: boolean) {
  return `:SX97,${enable ? 1 : 0}#`;
}

export function buildSpeedCommand(speed: number) {
  return `:R${speed}#`;
}

export function buildMaxSlewSpeedCommand(speed: MaxSlewSpeed) {
  const num = {
    vs: 5,
    s: 4,
    n: 3,
    f: 2,
    vf: 1,
  }[speed];

  return `:SX93,${num}#`;
}

export function buildRateTrackingCompCommand(
  rate: MountWithCompensation["rate_comp_type"],
  axes: MountWithCompensation["rate_comp_axes"]
) {
  const otk = ":To#";
  const don = ":T2#";
  const doff = ":T1#";
  const on = ":Tr#";
  const off = ":Tn#";

  const rateDef: Record<
    MountWithCompensation["rate_comp_type"],
    Record<
      MountWithCompensation["rate_comp_axes"],
      {
        status: string;
        commands: Record<string, string>;
      }
    >
  > = {
    full: {
      dual: {
        status: "full_both",
        commands: { otk, don },
      },
      single: {
        status: "full_ra",
        commands: { otk, doff },
      },
    },
    refraction_only: {
      dual: {
        status: "refr_both",
        commands: { on, don },
      },
      single: {
        status: "refr_ra",
        commands: { on, doff },
      },
    },
    none: {
      dual: {
        status: "none",
        commands: { off },
      },
      single: {
        status: "none",
        commands: { off },
      },
    },
  };

  const apiRate = rateDef[rate][axes];

  return {
    commands: apiRate.commands,
    expectedRateComp: apiRate.status,
  };
}
export function buildLocationCommand(
  type: "lat" | "long",
  coordinate: Coordinate,
  includeSeconds: boolean
) {
  const cmd = type === "lat" ? "St" : "Sg";

  const deg = signed(coordinate.deg, type === "lat" ? 3 : 4);
  const min = num(coordinate.min);
  const secs = includeSeconds ? num(coordinate.sec) : 0;

  return includeSeconds
    ? `:${cmd}${deg}*${min}:${secs}#`
    : `:${cmd}${deg}*${min}#`;
}

export function buildDateUpdateCommands(offset?: string) {
  const d = new Date();

  const utcOffset =
    typeof offset === "string"
      ? parseFloat(offset) * 60
      : new Date().getTimezoneOffset();

  const utcOffsetHours = Math.floor(utcOffset / 60);
  const utcOffsetMinutes = (utcOffset / 60 - utcOffsetHours) * 60;

  return {
    offset: `:SG${signed(utcOffsetHours, 3)}:${num(utcOffsetMinutes)}#`,
    date: `:SC${num(d.getMonth() + 1)}/${num(d.getDate())}/${num(
      d.getFullYear().toString().substr(-2)
    )}#`,
    time: `:SL${num(d.getHours())}:${num(d.getMinutes())}:${num(
      d.getSeconds()
    )}#`,
  };
}
