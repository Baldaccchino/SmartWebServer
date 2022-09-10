import { OnStep } from "../onStep";
import { Mount, RateComp } from "../../types";
import {
  mountIsValidCommand,
  statusCommands,
} from "../commands/onstepCommands";
import { charExists } from "./statusUtils";

type StatusFetchResponse = Awaited<ReturnType<typeof fetchStatus>>;
export async function fetchStatus(commander: OnStep) {
  // preflight request to make sure onstep is alive
  const isValid = await commander.sendCommand(mountIsValidCommand, false);

  if (isValid !== "On-Step") {
    console.error("On-Step was not recieved from the mount.", isValid);
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

export function getMountStatus(response: StatusFetchResponse): Mount {
  if (response.type !== "valid") {
    throw new Error("Attempted to get mount on invalid.");
  }

  const {
    response: {
      backlashRa,
      backlashDec,
      minAlt,
      maxAlt,
      degPastMerE,
      degPastMerW,
    },
    test,
  } = response;

  const type = test("E")
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

  switch (type) {
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
    type,
    ...rateComp,
    ...baseMount,
  };
}
