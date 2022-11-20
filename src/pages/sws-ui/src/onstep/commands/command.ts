export function validateCommand(cmd: string) {
  if (cmd.startsWith(":") && cmd.endsWith("#")) {
    return { valid: true as const };
  }

  const error = `Command ${cmd} was not valid. It needs to begin with : and end with #`;
  return { valid: false as const, error };
}

export class Command {
  private cmdKey;
  public readonly command;
  constructor(
    command: string,
    private returnKey: string,
    private index: number
  ) {
    this.command = command.trim();
    this.cmdKey = `cmd_${this.index}`;
  }

  get commandPayload() {
    return [this.cmdKey, this.command];
  }

  getResponseEntry(response: Record<string, string>) {
    return [this.returnKey, this.getResponseValue(response)];
  }

  getResponseValue(response: Record<string, string>) {
    return response[this.cmdKey] ?? "";
  }

  getCommandLogs(response: Record<string, string>) {
    return {
      command: this.command,
      response: this.getResponseValue(response),
      system: true,
      date: new Date(),
    };
  }

  validateCommand(onError: (e: string) => void) {
    const result = validateCommand(this.command);
    if (result.valid) {
      return this;
    }

    onError(result.error);
    throw new Error(result.error);
  }
}
