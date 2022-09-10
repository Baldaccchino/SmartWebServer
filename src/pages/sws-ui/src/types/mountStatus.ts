export type TrackingModes =
  | "sidereal" // Ts
  | "lunar" // Tl
  | "king"
  | "solar"; // Th;

export type RateComp =
  | "none"
  | "refr_ra"
  | "refr_both"
  | "full_ra"
  | "full_both";

export type MountType = "unknown" | "gem" | "fork" | "fork_alt" | "alt_az";

type DriverOutput = {
  open: boolean;
  short: boolean;
};

type ValidAxis = {
  valid: true;
  name: "ra" | "dec" | number;
  commsFailure: boolean;
  standStill: boolean;
  outputA: DriverOutput;
  outputB: DriverOutput;
  almostOverTemp: boolean;
  overTemp: boolean;
  fault: boolean;
};

type InvalidAxis = {
  valid: false;
};

export type Axis = ValidAxis | InvalidAxis;

type BaseMount = {
  min_alt: string;
  max_alt: string;
  backlash_ra: string;
  backlash_dec: string;
};

type MountWithoutCompensation = {
  type: "alt_az";
} & BaseMount;

export type Compensation = {
  rate_comp_type: "full" | "refraction_only" | "none";
  rate_comp_axes: "dual" | "single";
  rate_comp: RateComp;
};
export type MountWithCompensation = {
  type: "eq" | "unknown" | "fork" | "fork_alt";
} & BaseMount &
  Compensation;

type GemMount = {
  type: "gem";
  auto_meridian: boolean;
  pause_at_home: boolean;
  deg_past_mer_e: string;
  deg_past_mer_w: string;
} & Compensation &
  BaseMount;

export function mountHasCompensation(
  mount: Mount
): mount is MountWithCompensation {
  return mount.type !== "alt_az";
}

export type Mount = GemMount | MountWithCompensation | MountWithoutCompensation;

export type Coordinate = {
  deg: string;
  min: string;
  sec: string;
};

export type ValidMountStatus = {
  type: "valid";
  version: {
    wifi: string;
    onstep: string;
  };
  mount: Mount;
  dateTime: {
    utc: Date;
    utcOffset: string;
    browser: Date;
    datesAreOutOfSync: boolean;
  };
  position: {
    current: {
      ra: string;
      dec: string;
    };
    target: {
      ra: string;
      dec: string;
    };
  };
  location: {
    long: Coordinate;
    lat: Coordinate;
  };
  status: {
    tracking: boolean;
    parked: boolean;
    parkFail: boolean;
    slewing: boolean;
    home: boolean;
    aligning: boolean;
    waitingAtHome: boolean;
  };
  alignment: {
    maxStars: number;
    currentStar: number;
    lastRequiredStar: number;
  };
  tracking: {
    type: TrackingModes;
  };
  slewing: {
    maxSpeed: MaxSlewSpeed;
    speed: number;
  };
  features: {
    buzzer: boolean;
  };
  axes: Axis[];
};

export type MaxSlewSpeed = "vs" | "s" | "n" | "f" | "vf";

export type InvalidMountStatus = {
  type: "invalid";
};

export type MountStatus = (ValidMountStatus | InvalidMountStatus) & {
  lastError: false | string;
};
