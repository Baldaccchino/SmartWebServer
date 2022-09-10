export class Command {
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

  getResponseEntries(response: Record<string, string>) {
    return [this.returnKey, this.getResponseValue(response)];
  }

  getResponseValue(response: Record<string, string>) {
    return response[this.cmdKey] ?? "";
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
