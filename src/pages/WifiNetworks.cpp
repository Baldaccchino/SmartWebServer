#include "./Pages.common.h"
#include "../lib/wifi/WifiManager.h"

extern bool loginRequired;

bool checkLogin() {
    String data = "";

    data=www.arg("login");
    if (data!="") {
        if (!strcmp(wifiManager.settings.masterPassword,(char*)data.c_str())) loginRequired=false;
    }

    data=www.arg("logout");
    if (data!="") loginRequired=true;

    if (loginRequired) {
        www.send(401, "text/plain", "");
        return false;
    }

    return true;
}

void ajaxWifiNetworks()
{
    String extended;
    char tmp[420] = "";
    String data = "";

    if (!checkLogin()) {
        return;
    }

    sprintf(tmp, "sta_ssid|%s\n", wifiManager.sta->ssid);
    data += tmp;

    sprintf(tmp, "ap_ssid|%s\n", wifiManager.settings.ap.ssid);
    data += tmp;

    if (strlen(wifiManager.sta->pwd) > 0) data += "sta_secured|1\n";
    else data += "sta_secured|0\n";

    sprintf(tmp, "ap_ssid|%s\n", wifiManager.settings.ap.ssid);

    uint8_t macap[6] = {0,0,0,0,0,0}; WiFi.softAPmacAddress(macap);
    char wifi_ap_mac[80]="";
    for (int i=0; i<6; i++) { sprintf(wifi_ap_mac,"%s%02x:",wifi_ap_mac,macap[i]); } wifi_ap_mac[strlen(wifi_ap_mac)-1]=0;
  
    sprintf(tmp, "ap_mac|%s\n", wifi_ap_mac); data += tmp;
    sprintf(tmp, "ap_ip|%d.%d.%d.%d\n", wifiManager.settings.ap.ip[0],wifiManager.settings.ap.ip[1],wifiManager.settings.ap.ip[2],wifiManager.settings.ap.ip[3]); data += tmp;
    sprintf(tmp, "ap_gw|%d.%d.%d.%d\n", wifiManager.settings.ap.gw[0],wifiManager.settings.ap.gw[1],wifiManager.settings.ap.gw[2],wifiManager.settings.ap.gw[3]); data += tmp;
    sprintf(tmp, "ap_sn|%d.%d.%d.%d\n", wifiManager.settings.ap.sn[0],wifiManager.settings.ap.sn[1],wifiManager.settings.ap.sn[2],wifiManager.settings.ap.sn[3]); data += tmp;

    uint8_t mac[6] = {0,0,0,0,0,0}; WiFi.macAddress(mac);
    char wifi_sta_mac[80]="";
    for (int i=0; i<6; i++) { sprintf(wifi_sta_mac,"%s%02x:",wifi_sta_mac,mac[i]); } wifi_sta_mac[strlen(wifi_sta_mac)-1]=0;
    sprintf(tmp, "sta_mac|%s\n",wifi_sta_mac); data += tmp;
    sprintf(tmp, "sta_ip|%d.%d.%d.%d\n", wifiManager.sta->ip[0],wifiManager.sta->ip[1],wifiManager.sta->ip[2],wifiManager.sta->ip[3]); data += tmp;
    sprintf(tmp, "sta_gw|%d.%d.%d.%d\n", wifiManager.sta->gw[0],wifiManager.sta->gw[1],wifiManager.sta->gw[2],wifiManager.sta->gw[3]); data += tmp;
    sprintf(tmp, "sta_sn|%d.%d.%d.%d\n", wifiManager.sta->sn[0],wifiManager.sta->sn[1],wifiManager.sta->sn[2],wifiManager.sta->sn[3]); data += tmp;

    if (wifiManager.settings.accessPointEnabled) data += "ap|1\n";
    else data += "ap|0\n";

    if (wifiManager.settings.stationEnabled) data += "sta|1\n";
    else data += "sta|0\n";

    if (wifiManager.sta->dhcpEnabled) data += "sta_dhcp|1\n";
    else data += "sta_dhcp|0\n";

    if (wifiManager.restartRequired) data += "restart_required|1\n";
    else data += "restart_required|0\n";

    www.send(200, "text/plain", data);
}

void ajaxScanNetworks()
{
    String data = "";

    if (!checkLogin()) {
        return;
    }

    int n = WiFi.scanNetworks();
    for (int i = 0; i < n; i++) {
        data += WiFi.SSID(i);
        data += "|";
        data += WiFi.encryptionType(i) == ENC_TYPE_NONE ? "open" : "secured";
        data += "\n";
    }

    www.send(200, "text/plain", data);
}
