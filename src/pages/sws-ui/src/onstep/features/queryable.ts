import { OnStep } from "../onStep";
import { nonNull } from "../../utils/filter";

export interface Queryable {
  // return null if you don't want this resource to get updated
  getQueryCommand(index: number): string | null;
  handleResponse(responses: string): void;
}

// query and a bulk group of resources, for example, array of focusers.
export async function updateResources(onStep: OnStep, resources: Queryable[]) {
  const commandArray = resources
    .map((d, i) => d.getQueryCommand(i))
    .filter(nonNull);
  if (!commandArray.length) return;

  const status = await onStep.sendCommandArray(commandArray);

  resources.map((d, i) => d.handleResponse(status[i]));
}
