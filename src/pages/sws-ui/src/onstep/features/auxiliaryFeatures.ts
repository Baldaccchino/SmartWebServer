import { times } from "../../utils/compareObjects";
import {
  buildAuxFeatureQueryCommand,
  buildAuxFeatureUpdateCommand,
  checkAuxFeatureNumbersCommand,
} from "../commands/onstepCommands";
import type { OnStep } from "../onStep";
import { Queryable, updateResources } from "./queryable";
import { nonNull } from "../../utils/filter";

type Purpose = "switch" | "analogOutput" | "dewHeater" | "intervalometer";

type FeatureValues = [number, number, number, number];

class AuxiliaryFeatureScan implements Queryable {
  private _feature?: AuxiliaryFeature;
  constructor() {}
  getQueryCommand(index: number): string | null {
    return buildAuxFeatureQueryCommand(index);
  }

  get feature() {
    return this._feature;
  }

  handleResponse(response: string): void {
    const [name, _purpose] = response?.split(",") ?? [];

    if (!name || !_purpose) {
      return;
    }

    const purpose = (
      ["switch", "analogOutput", "dewHeater", "intervalometer"] as const
    )[parseInt(_purpose)];

    if (!purpose || !name) {
      return;
    }

    this._feature = new AuxiliaryFeature(name, purpose);
  }
}

export class AuxiliaryFeature implements Queryable {
  private _values?: FeatureValues;

  constructor(public readonly name: string, public readonly purpose: Purpose) {}

  get values() {
    return this._values;
  }

  getQueryCommand(index: number) {
    return buildAuxFeatureUpdateCommand(index);
  }

  handleResponse(response: string): void {
    const splits = response.split(",");

    const newValues = times(4).map(() => 0);

    splits.forEach((v, i) => {
      if (i === 0) newValues[i] = parseInt(v);
      else newValues[i] = parseFloat(v);
    });
  }
}

function responseValid(s: string) {
  return s && s.length === 8;
}

export async function getAuxFeatures(onStep: OnStep) {
  // try twice
  let response = await onStep.sendCommand(checkAuxFeatureNumbersCommand);
  if (!responseValid(response)) {
    response = await onStep.sendCommand(checkAuxFeatureNumbersCommand);
  }

  if (!responseValid(response)) {
    return [];
  }

  const features = times(8).map((i) => new AuxiliaryFeatureScan());

  await updateResources(onStep, features);

  return features.map((f) => f.feature).filter(nonNull);
}
