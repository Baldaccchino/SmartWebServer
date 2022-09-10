import { Coordinate, MaxSlewSpeed, TrackingModes } from "../../types";

function clamp(n: number, min = 0, max: number) {
  return Math.max(Math.min(n, max), min);
}
export function charExists(status: string, char: string) {
  return status.indexOf(char) > -1;
}
export function getTrackSpeed(currentRate: string, nominalRate: string) {
  const rateRatio = parseFloat(currentRate) / parseFloat(nominalRate);
  let trackSpeed: MaxSlewSpeed = "vs";

  if (rateRatio > 1.75) {
    trackSpeed = "vf";
  } else if (rateRatio > 1.25) {
    trackSpeed = "f";
  } else if (rateRatio > 0.875) {
    trackSpeed = "n";
  } else if (rateRatio > 0.625) {
    trackSpeed = "s";
  }
  return trackSpeed;
}

export function parseVersion(version: string) {
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

export function getBasicStatus(test: (char: string) => boolean) {
  const status = {
    parking: test("I"),
    parkFail: test("F"),
    homing: test("h"),
    guiding: test("g"),
    waitingAtHome: test("w"),
    buzzerEnabled: test("z"),
    parked: false,
    tracking: false,
    slewing: false,
    home: false,
  };

  if (!test("N")) status.slewing = true;
  else status.tracking = !test("n");

  status.parked = test("P");
  if (test("p")) status.parked = false;

  status.home = test("H") && !status.parked;

  return status;
}
export function getAlignment(alignStars: string) {
  if (alignStars.length !== 3) {
    return {
      maxStars: 0,
      currentStar: 0,
      lastRequiredStar: 0,
    };
  }
  const [maxStars, currentStar, lastRequiredStar] = alignStars
    .split("")
    .map((v) => parseInt(v));

  return { maxStars, currentStar, lastRequiredStar };
}
export function getLastError(mountStatus: string) {
  return (
    [
      false as const,
      "Motor/driver fault",
      "Below horizon limit",
      "Limit sense",
      "Dec limit exceeded",
      "Azm limit exceeded",
      "Under pole limit exceeded",
      "Meridian limit exceeded",
      "Sync safety limit exceeded",
      "Park failed",
      "Goto sync failed",
      "Unknown error",
      "Above overhead limit",
      "Weather sensor init failed",
      "Time or loc. not updated",
      "Init NV/EEPROM error",
      "Unknown Error, code",
    ][parseInt(mountStatus.slice(-1))] ?? false
  );
}

export function getGuideRate(mountStatus: string) {
  return clamp(
    parseInt(
      mountStatus.substring(mountStatus.length - 2, mountStatus.length - 1)
    ),
    0,
    9
  );
}
export function getDateTime(
  utcDate: string,
  utcTime: string,
  utcOffset: string
) {
  const dateTimeData = {
    utc: new Date(getDate(utcDate, utcTime)),
    utcOffset: utcOffset,
    browser: new Date(),
  };

  const dateDiff = Math.abs(
    dateTimeData.browser.getTime() - dateTimeData.utc.getTime()
  );

  const datesAreOutOfSync = dateDiff > 60000;
  const dateTime = {
    ...dateTimeData,
    datesAreOutOfSync,
  };
  return dateTime;
}
export function getTrackingMode(trackValue: number): TrackingModes {
  function checkTrackType(compare: number) {
    return Math.abs(trackValue - compare) < 0.001;
  }

  return checkTrackType(60.164)
    ? "sidereal"
    : checkTrackType(57.9)
    ? "lunar"
    : checkTrackType(60.0)
    ? "solar"
    : checkTrackType(60.136)
    ? "king"
    : "sidereal";
}
export function getLocation(loc: string): Coordinate {
  const nums = loc
    .split(/[:*]/)
    .map((v) => parseInt(v))
    .map((v) => String(v));
  const keys = ["deg", "min", "sec"] as const;

  return Object.fromEntries(keys.map((key, i) => [key, nums[i]])) as Coordinate;
}
function getDate(date: string, time: string) {
  const [_m, _d, _y] = date.split("/");

  const times = time.split(":");

  const formattedDate = [
    `20${_y.padStart(2, "0")}`,
    _m.padStart(2, "0"),
    _d.padStart(2, "0"),
  ].join("-");

  const formattedTime = times.map((time) => time.padStart(2, "0")).join(":");

  return [[formattedDate, formattedTime].join("T"), "Z"].join("");
}
