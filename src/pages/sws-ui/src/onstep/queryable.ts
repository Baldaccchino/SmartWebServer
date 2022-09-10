import { OnStep } from "./onStep";
import { nonNull } from "./filter";

export interface Queryable {
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
