import { Command } from "./command";

describe("Command class", () => {
  it("Generates a command payload to send.", () => {
    const cmd = new Command("foocmd", "fookey", 1);

    // gets zipped up and sent to server
    expect(cmd.commandPayload).toEqual(["cmd_1", "foocmd"]);

    // extracts return key and response
    expect(cmd.getResponseEntry({ cmd_1: "fooresponse" })).toEqual([
      "fookey",
      "fooresponse",
    ]);
  });
});
