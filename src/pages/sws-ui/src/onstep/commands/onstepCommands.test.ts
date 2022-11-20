import {
  buildLocationCommand,
  buildTrackingTypeCommand,
} from "./onstepCommands";

describe("Onstep command generator", () => {
  it("builds location update commands", () => {
    const coord = {
      deg: "80",
      min: "15",
      sec: "30",
    };

    expect(buildLocationCommand("lat", coord, true)).toEqual(":St+80*15:30#");
    expect(buildLocationCommand("long", coord, true)).toEqual(":Sg+080*15:30#");

    expect(buildLocationCommand("lat", coord, false)).toEqual(":St+80*15#");
    expect(buildLocationCommand("long", coord, false)).toEqual(":Sg+080*15#");
  });

  it("builds tracking type commands", () => {
    expect(buildTrackingTypeCommand("sidereal")).toEqual(":TQ#");
    expect(buildTrackingTypeCommand("lunar")).toEqual(":TL#");
    expect(buildTrackingTypeCommand("solar")).toEqual(":TS#");
    expect(buildTrackingTypeCommand("king")).toEqual(":TK#");
  });
});
