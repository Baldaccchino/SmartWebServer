import { OnStep } from "./onStep";
import { nonNull } from "./filter";

type Output = {
  open: boolean;
  short: boolean;
};

type ValidAxis = {
  valid: true;
  commsFailure: boolean;
  standStill: boolean;
  outputA: Output;
  outputB: Output;
  almostOverTemp: boolean;
  overTemp: boolean;
  fault: boolean;
};

type InvalidAxis = {
  valid: false;
};
type Axis = ValidAxis | InvalidAxis;

interface Queryable {
  // return null if you don't want this resource to get updated
  get queryCommand(): string | null;
  handleResponse(responses: string[]): void;
}

export async function updateResources(onStep: OnStep, resources: Queryable[]) {
  const status = await onStep.sendCommandArray(
    resources.map((d) => d.queryCommand).filter(nonNull)
  );

  resources.map((d) => d.handleResponse(status));
}

export class Focuser implements Queryable {
  private valid = false;
  private value: string | null = null;
  constructor(private index: number) {}
  get queryCommand() {
    return `:GXX${this.index + 1}#`;
  }
  handleResponse(responses: string[]) {
    const response = responses[this.index];
    if (!response) {
      this.valid = false;
      return;
    }
    this.value = response;
  }
}

export class Driver implements Queryable {
  private failedQueries = 0;
  private status?: Axis;
  constructor(private index: number) {}

  get queryCommand() {
    if (this.disabled) {
      return null;
    }

    return `:GXU${this.index + 1}#`;
  }

  get disabled() {
    return this.status?.valid === false;
  }

  handleResponse(responses: string[]) {
    const response = responses[this.index];
    if (typeof response === "undefined") {
      return;
    }

    const test = (v: string) => response.indexOf(v) > -1;

    if (response === "0") {
      this.status = {
        valid: false,
      };
      return;
    }

    this.status = {
      valid: true,
      commsFailure: test("ST,OA,OB,GA,GB,OT,PW"),
      standStill: test("ST"),
      outputA: {
        open: test("OA"),
        short: test("GA"),
      },
      outputB: {
        open: test("OB"),
        short: test("GB"),
      },
      overTemp: test("OT"),
      almostOverTemp: test("PW"),
      fault: test("GF"),
    };

    return response;
  }
}
