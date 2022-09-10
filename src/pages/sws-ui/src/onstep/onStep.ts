import { Mutex } from "async-mutex";
import { MountStatus } from "../types";
import { API } from "../api/api";
import { Command, validateCommand } from "./command";
import { MountFeatures, OnStepStatus } from "./onStepStatus";

export class OnStep {
  public commandLogs: {
    command: string;
    response: string;
    date: Date;
    system: boolean;
  }[] = [];

  private _status;
  private mutex;
  private _onStatus?: (status: MountStatus) => void;

  constructor(private api: API, private onError: (error: string) => void) {
    api.onVersionAvailable((v) => this._status.setSwsVersion(v));

    this._status = new OnStepStatus(this, (status) => this._onStatus?.(status));

    this.mutex = new Mutex();

    this._status.startHeartbeat();
  }

  onStatusUpdate(fn: (status: MountStatus) => void) {
    this._onStatus = fn;
    return this;
  }

  mountSupports(feature: MountFeatures) {
    return this._status.mountSupports(feature);
  }

  getValidStatus() {
    const status = this._status.getValidStatus();
    if (!status) {
      throw new Error("Attempted to get status before it was available.");
    }
    return status;
  }

  disconnect() {
    this._status.stopHeartbeat();
  }

  refreshStatus() {
    return this._status.refreshStatus();
  }

  get status() {
    return this._status.status;
  }

  /**
   * Sends an array of commands to OnStep. It returns the command responses
   * in an array of the same order as supplied.
   */
  async sendCommandArray(cmds: string[]) {
    const commands = cmds.map((c, i) => new Command(c, i.toString(), i));
    const response = await this.api.get<Record<string, string>>(
      "ajax/cmds",
      Object.fromEntries(commands.map((c) => c.commandPayload))
    );

    return commands.map((c) => c.getResponseValue(response));
  }

  /**
   * Send an object of commands. It returns an object with the same keys,
   * but the values are the command responses: { [TFriendlyCommandName]: TResponse }
   */
  async sendCommands<
    TFriendlyCommandName extends string,
    TCommand extends string,
    TResponse extends string
  >(
    cmds: Record<TFriendlyCommandName, TCommand>,
    shouldLog: "log" | "nolog" = "log"
  ): Promise<Record<TFriendlyCommandName, TResponse>> {
    // { [TFriendlyCommandName]: new Command(TCommand) }
    const commands = Object.entries(cmds).map(([returnKey, command], i) => {
      this.validateCommand(command as TFriendlyCommandName);
      return new Command(command as TFriendlyCommandName, returnKey, i);
    });

    // send the response in format { [cmd_${i}]: TCommand }
    const response = await this.apiRequest<Record<string, string>>(
      "ajax/cmds",
      Object.fromEntries(commands.map((c) => c.commandPayload))
    );

    // zip up the command response into { [TFriendlyCommandName]: TResponse }
    const commandResponse = Object.fromEntries(
      commands.map((c) => c.getResponseEntriy(response))
    );

    if (shouldLog === "log") {
      this.commandLogs.unshift(
        ...commands.map((c) => c.getCommandLogs(response))
      );
    }

    return commandResponse;
  }

  /**
   * Send a singular command to the mount. It returns the command response.
   */
  async sendCommand(cmd: string, shouldLogCommand = true) {
    this.validateCommand(cmd);

    const response = (
      await this.rawApiRequest("ajax/cmd", {
        cmd,
      })
    ).data;

    this.commandLogs.unshift({
      command: cmd,
      system: shouldLogCommand,
      response,
      date: new Date(),
    });

    return response;
  }

  private validateCommand(cmd: string) {
    const result = validateCommand(cmd);
    if (result.valid) {
      return;
    }

    this.onError(result.error);
    throw new Error("Invalid command");
  }

  private apiRequest<TApiData>(ep: string, data: object): Promise<TApiData> {
    return this.mutex.runExclusive(() => this.api.get<TApiData>(ep, data));
  }

  private rawApiRequest(ep: string, data: object) {
    return this.mutex.runExclusive(() => this.api.getWithoutParse(ep, data));
  }
}
