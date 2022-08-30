import { API } from "./api";
import { WifiConfig, WifiSettingsResponse } from "../types";
import { parseWifiSettingsResponse } from "./parseResponse";

function prepareIpForUpdate(ip: string, keyPrefix: string) {
  return Object.fromEntries(
    ip.split(".").map((num, index) => [`${keyPrefix}${index + 1}`, num])
  );
}

function boolTo10(b: boolean) {
  return b ? 1 : 0;
}

export class WifiApi {
  constructor(private api: API) {}
  wifiLogout() {
    return this.api.get("ajax/wifi", {
      logout: true,
    });
  }

  async scanForWifiNetworks() {
    return this.api.get<Record<string, "open" | "secured">>("ajax/wifi/scan");
  }

  async getWifiSettings(login?: string) {
    return parseWifiSettingsResponse(
      await this.api.get<WifiSettingsResponse>("ajax/wifi", {
        login,
      })
    );
  }

  async updateStation(config: WifiConfig["station"], password?: string) {
    return this.update({
      ...(password?.length ? { stpwd: password } : {}),
      stssid: config.network.ssid,
      staen: boolTo10(config.enabled),
      stadhcp: boolTo10(config.network.dhcp),
      ...prepareIpForUpdate(config.network.ip, "staip"),
      ...prepareIpForUpdate(config.network.sn, "stasn"),
      ...prepareIpForUpdate(config.network.gw, "stagw"),
    });
  }

  async updateAp(config: WifiConfig["accessPoint"], password?: string) {
    return this.update({
      ...(password?.length ? { appwd: password } : {}),
      apen: boolTo10(config.enabled),
      apssid: config.network.ssid,
      ...prepareIpForUpdate(config.network.ip, "apip"),
      ...prepareIpForUpdate(config.network.sn, "apsn"),
      ...prepareIpForUpdate(config.network.gw, "apgw"),
    });
  }

  private async update(updates: object) {
    await this.api.get("net.htm", updates);
    return this.getWifiSettings();
  }
}
