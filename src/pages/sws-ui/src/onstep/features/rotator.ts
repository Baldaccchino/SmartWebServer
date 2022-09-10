import { rotatorStatusCommand } from "../commands/onstepCommands";
import { Queryable } from "./queryable";
import type { RotatorStatus } from "../../types";
export class Rotator implements Queryable {
  private _status: RotatorStatus = {
    rotatorFound: false,
    derotatorFound: false,
  };
  private scanned = false;

  constructor() {}

  get status() {
    return this._status;
  }
  getQueryCommand() {
    if (this.scanned) {
      return null;
    }

    return rotatorStatusCommand;
  }

  handleResponse(response: string): void {
    if (!response) {
      return;
    }

    this.scanned = true;
    switch (response) {
      case "R":
        this._status = {
          rotatorFound: true,
          derotatorFound: false,
        };
        break;
      case "D":
        this._status = {
          rotatorFound: true,
          derotatorFound: true,
        };
        break;
    }
  }
}
