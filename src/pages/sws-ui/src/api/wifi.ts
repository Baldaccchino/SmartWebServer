import { API } from "./api";
import { WifiConfig, WifiSettingsResponse } from "../types";
import { oneZeroBool } from "../utils/num";

function prepareIpForUpdate(ip: string, keyPrefix: string) {
  return Object.fromEntries(
    ip.split(".").map((num, index) => [`${keyPrefix}${index + 1}`, num])
  );
}

function boolTo10(b: boolean) {
  return b ? 1 : 0;
}

export function parseWifiSettingsResponse(
  response: WifiSettingsResponse
): WifiConfig {
  return {
    restartRequired: oneZeroBool(response.restart_required),
    station: {
      network: {
        ip: response.sta_ip,
        ssid: response.sta_ssid,
        mac: response.sta_mac,
        gw: response.sta_gw,
        sn: response.sta_sn,
        secured: oneZeroBool(response.sta_secured),
        dhcp: oneZeroBool(response.sta_dhcp),
      },
      enabled: oneZeroBool(response.sta),
    },
    accessPoint: {
      network: {
        ip: response.ap_ip,
        ssid: response.ap_ssid,
        mac: response.ap_mac,
        gw: response.ap_gw,
        sn: response.ap_sn,
      },
      enabled: oneZeroBool(response.ap),
    },
  };
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
