import { API } from "./api";
import { Command } from "./commander";

export class OnStep {
  public commandLogs: {
    command: string;
    response: string;
    date: Date;
    system: boolean;
  }[] = [];

  constructor(private api: API, private onError: (error: string) => void) {}

  async sendCommandArray(cmds: string[]) {
    const commands = cmds.map((c, i) => new Command(c, i.toString(), i));
    const response = await this.api.get<Record<string, string>>(
      "ajax/cmds",
      Object.fromEntries(commands.map((c) => c.commandPayload))
    );

    return commands.map((c) => c.getResponseValue(response));
  }

  async sendCommands<T extends string>(
    cmds: Record<T, string>,
    shouldLog: "log" | "nolog" = "log"
  ): Promise<Record<T, string>> {
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
      commands.map((c) => c.getResponseEntries(response))
    );

    const commandLogs = commands.map((c) => c.getLogResponse(response));

    if (shouldLog === "log") {
      this.commandLogs.unshift(...commandLogs);
    }

    return {
      ...commandResponse,
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
