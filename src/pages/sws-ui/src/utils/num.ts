import { OneZero } from "../types";
export function num(num: number | string, digits: number = 2) {
  return num.toString().padStart(digits, "0");
}

export function signed(v: number | string, digits: number = 2) {
  const vv = typeof v === "string" ? parseInt(v) : v;

  const sign = vv > -1 ? "+" : "-";
  return `${sign}${num(Math.abs(vv), digits - 1)}`;
}

export function oneZeroBool(v: OneZero) {
  return v === "1";
}
