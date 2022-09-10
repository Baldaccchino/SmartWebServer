import { Queryable } from "./queryable";

export class Focuser implements Queryable {
  private valid = false;
  private value: string | null = null;
  constructor(private index: number, private supportsSixFocusers: boolean) {}
  get queryCommand() {
    if (this.supportsSixFocusers) {
      return `:F${this.index + 1}a#`;
    }

    return this.index === 0 ? ":FA#" : ":fA#";
  }

  handleResponse(responses: string[]) {
    const response = responses[this.index];
    if (!response) {
      this.valid = false;
      return;
    }
    this.value = response;
  }
}
