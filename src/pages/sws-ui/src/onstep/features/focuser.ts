import {
  buildFocuserActiveCommand,
  firstFocuserActive,
  secondFocuserActive,
} from "../commands/onstepCommands";
import { Queryable } from "./queryable";

export class Focuser implements Queryable {
  private status: "notScanned" | "valid" | "invalid" = "notScanned";
  private value: string | null = null;
  constructor(private supportsSixFocusers: boolean) {}

  getQueryCommand(index: number) {
    if (this.status === "invalid") {
      return null;
    }

    if (this.supportsSixFocusers) {
      return buildFocuserActiveCommand(index + 1);
    }

    return index === 0 ? firstFocuserActive : secondFocuserActive;
  }

  handleResponse(response: string) {
    if (!response || response === "0") {
      this.status = "invalid";
      return;
    }

    this.status = "valid";
    this.value = response;
  }
}
