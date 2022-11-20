import {
  getAlignment,
  getDate,
  getLocation,
  getTrackingMode,
  parseVersion,
} from "./statusUtils";

it("extracts the software version", () => {
  expect(parseVersion("2.1a")).toEqual({
    major: 2,
    minor: 1,
    patch: "a",
  });

  expect(parseVersion("?")).toEqual({
    major: -1,
    minor: -1,
    patch: -1,
  });
});

it("gets alignment status", () => {
  expect(getAlignment("801")).toEqual({
    maxStars: 8,
    currentStar: 0,
    lastRequiredStar: 1,
  });
});

it("gets location from string", () => {
  expect(getLocation("10:21:39")).toEqual({
    deg: "10",
    min: "21",
    sec: "39",
  });
});

it("gets the correct tracking mode", () => {
  expect(getTrackingMode(60.164)).toEqual("sidereal");
  expect(getTrackingMode(57.9)).toEqual("lunar");
  expect(getTrackingMode(60)).toEqual("solar");
  expect(getTrackingMode(60.136)).toEqual("king");
});

it("parses a date from onstep", () => {
  expect(getDate("11/1/99", "12:1:34")).toEqual("2099-11-01T12:01:34Z");
});
