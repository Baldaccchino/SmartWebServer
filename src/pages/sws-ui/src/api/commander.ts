import { API } from "./api";

class Command {
  private cmdKey;
  constructor(
    public readonly command: string,
    private returnKey: string,
    private index: number
  ) {
    this.cmdKey = `cmd_${this.index}`;
  }

  get commandPayload() {
    return [this.cmdKey, this.command];
  }

  generateResponse(response: Record<string, string>) {
    return [this.returnKey, response[this.cmdKey] ?? ""];
  }

  getLogResponse(response: Record<string, string>) {
    return {
      command: this.command,
      response: response[this.cmdKey],
      system: true,
      date: new Date(),
    };
  }
}

export class Commander {
  public commandLogs: {
    command: string;
    response: string;
    date: Date;
    system: boolean;
  }[] = [];

  constructor(private api: API, private onError: (error: string) => void) {}

  async sendCommands<T extends string>(
    cmds: Record<T, string>,
    shouldLog: "log" | "nolog" = "log"
  ): Promise<Record<T, string> & { swsVersion: string }> {
    // generate command classes that will be hydrated with responses later
    const commands = Object.entries(cmds).map(([returnKey, command], i) => {
      this.validateCommand(command as T);
      return new Command(command as T, returnKey, i);
    });

    const response = await this.api.get<Record<string, string>>(
      "ajax/cmds",
      Object.fromEntries(commands.map((c) => c.commandPayload))
    );

    const commandResponse = Object.fromEntries(
      commands.map((c) => c.generateResponse(response))
    );

    const commandLogs = commands.map((c) => c.getLogResponse(response));

    if (shouldLog === "log") {
      this.commandLogs.unshift(...commandLogs);
    }

    const swsVersion = response.sws_version;

    return {
      ...commandResponse,
      swsVersion,
    };
  }

  async sendCommand(cmd: string, system = true) {
    this.validateCommand(cmd);

    const response = (
      await this.api.getWithoutParse("ajax/cmd", {
        cmd,
      })
    ).data;

    this.commandLogs.unshift({
      command: cmd,
      system,
      response,
      date: new Date(),
    });

    return response;
  }

  private validateCommand(cmd: string) {
    if (cmd.startsWith(":") && cmd.endsWith("#")) {
      return true;
    }

    const err = `Command ${cmd} was not valid. It needs to begin with : and end with #`;
    this.onError(err);
    throw new Error(err);
  }
}
