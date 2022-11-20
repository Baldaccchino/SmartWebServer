import { Mutex } from "async-mutex";
import { MountStatus } from "../types";
import { API } from "../api/api";
import { Command } from "./commands/command";
import { MountFeatures, OnStepStatus } from "./onStepStatus";

type ShouldLog = "log" | "nolog";
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
      this.onError(
        `Attempted to access mount status, but was unable to get a valid status. The mount might be disconnected.`
      );
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
  async sendCommandArray(cmds: string[], shouldLog: ShouldLog = "nolog") {
    const commands = cmds.map((c, i) => new Command(c, i.toString(), i));
    const response = await this.api.get<Record<string, string>>(
      "ajax/cmds",
      Object.fromEntries(commands.map((c) => c.commandPayload))
    );

    this.log(commands, response, shouldLog);

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
      return new Command(
        command as TFriendlyCommandName,
        returnKey,
        i
      ).validateCommand(this.onError);
    });

    // send the response in format { [cmd_${i}]: TCommand }
    const response = await this.apiRequest<Record<string, string>>(
      "ajax/cmds",
      Object.fromEntries(commands.map((c) => c.commandPayload))
    );

    // zip up the command response into { [TFriendlyCommandName]: TResponse }
    const commandResponse = Object.fromEntries(
      commands.map((c) => c.getResponseEntry(response))
    );

    this.log(commands, response, shouldLog);

    return commandResponse;
  }

  private log(
    commands: Command[],
    response: Record<string, string>,
    shouldLog: ShouldLog
  ) {
    if (shouldLog === "log") {
      this.commandLogs.unshift(
        ...commands.map((c) => c.getCommandLogs(response))
      );
    }
  }

  /**
   * Send a singular command to the mount. It returns the command response.
   */
  async sendCommand(cmd: string, shouldLog: ShouldLog = "nolog") {
    return (await this.sendCommandArray([cmd], shouldLog))[0];
  }

  /**
   * thinly wrap the API class in a mutex to ensure only one request in flight at a time.
   */
  private apiRequest<TApiData>(ep: string, data: object): Promise<TApiData> {
    return this.mutex.runExclusive(() => this.api.get<TApiData>(ep, data));
  }
}
