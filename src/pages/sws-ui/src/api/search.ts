import { buildSlewCommand } from "../onstep/commands";
import { Direction } from "../types";
import { Commander } from "./commander";

export class Search {
  private stopped = false;
  private timeout?: number;
  constructor(private commander: Commander) {}

  async search() {
    // execute a series of search patterns roughly approximating a box.
    // execute the box with progressively larger diameters.
    for (const i of [1, 2, 3, 4, 5]) {
      await this.slewFor(1000 * i, ["n"]);
      await this.slewFor(1000 * i, ["e"]);
      await this.slewFor(2000 * i, ["s"]);
      await this.slewFor(2000 * i, ["w"]);
      await this.slewFor(2000 * i, ["n"]);
      await this.slewFor(1000 * i, ["e"]);
      await this.slewFor(1000 * i, ["s"]);

      await this.slewFor(1000 * i, ["s", "w"]);
      await this.slewFor(2000 * i, ["n", "e"]);

      await this.slewFor(1000 * i, ["e"]);
      await this.slewFor(1000 * i, ["s"]);
    }
  }

  async stop() {
    clearTimeout(this.timeout);
    this.stopped = true;
    for (const d of ["n", "e", "w", "s"] as Direction[]) {
      await this.commander.sendCommand(buildSlewCommand(d, false));
    }
  }

  private async slewFor(time: number, direction: Direction[]) {
    if (this.stopped) {
      return;
    }

    await this.move(direction, "start");

    return new Promise((resolve) => {
      this.timeout = setTimeout(async () => {
        await this.move(direction, "stop");

        this.timeout = undefined;
        resolve(null);
      }, time) as any as number;
    });
  }

  private async move(dirs: Direction[], start: "start" | "stop" = "start") {
    for (const d of dirs) {
      await this.commander.sendCommand(buildSlewCommand(d, start === "start"));
    }
  }
}
