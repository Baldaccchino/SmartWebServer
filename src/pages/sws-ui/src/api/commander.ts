import { API } from "./api";

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
    noLog: "log" | "nolog" = "log"
  ): Promise<Record<T, string> & { swsVersion: string }> {
    Object.values(cmds).forEach((cmd) => this.validateCommand(cmd as string));

    const returnMap: Record<string, T> = Object.fromEntries(
      Object.keys(cmds).map((key, i) => [`cmd_${i}`, key as T])
    );

    const response = await this.api.get<Record<string, string>>(
      "ajax/cmds",
      Object.fromEntries(
        Object.entries(cmds).map(([key, cmd], i) => [`cmd_${i}`, cmd])
      )
    );

    const commandResponses = Object.entries(response).map(([_cmd_num, v]) => ({
      command: cmds[returnMap[_cmd_num]],
      response: v,
      system: true,
      date: new Date(),
    }));

    if (noLog === "log") {
      this.commandLogs.unshift(...commandResponses);
    }

    const swsVersion = response.sws_version;

    return {
      ...(Object.fromEntries(
        Object.entries(returnMap).map(([cmd, key]) => [key, response[cmd]])
      ) as Record<T, string>),
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
