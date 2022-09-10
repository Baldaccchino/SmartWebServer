import { WifiSettingsResponse, WifiConfig } from "../types";
import { oneZeroBool } from "../utils/num";

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
