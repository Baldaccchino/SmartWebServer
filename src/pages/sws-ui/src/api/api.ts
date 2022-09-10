import axios, { AxiosResponse, AxiosError } from "axios";

export class API {
  private axios;
  private _onNetworkDown?: () => void;
  private _onNetworkUp?: () => void;
  private _onVersionAvailable?: (v: string) => void;
  constructor() {
    this.axios = axios.create({
      baseURL: `${import.meta.env.VITE_API}`,
      timeout: 5000,
    });
  }

  async getWithoutParse(url: string, params?: object) {
    try {
      const response = await this.axios.get<string>(url, {
        params: {
          ...(params ?? {}),
          cache: Date.now(),
        },
      });

      const version = response.headers["x-sws-version"];
      if (version) {
        this._onVersionAvailable?.(version);
      }

      this._onNetworkUp?.();
      return response;
    } catch (e) {
      if (["ERR_NETWORK", "ECONNABORTED"].includes((e as AxiosError)?.code!)) {
        this._onNetworkDown?.();
      }
      throw e;
    }
  }

  onVersionAvailable(fn: (v: string) => void) {
    this._onVersionAvailable = fn;
    return this;
  }

  onNetworkDown(fn: () => void) {
    this._onNetworkDown = fn;
    return this;
  }

  onNetworkUp(fn: () => void) {
    this._onNetworkUp = fn;
    return this;
  }

  async get<T>(url: string, params?: object) {
    return this.parseResponse<T>(await this.getWithoutParse(url, params));
  }

  private parseResponse<T>(response: AxiosResponse) {
    const data = response.data;

    return Object.fromEntries(
      data
        .split("\n")
        .filter(Boolean)
        .map((v: string) => {
          return v.split("|");
        })
    ) as T;
  }
}

export const api = new API();
