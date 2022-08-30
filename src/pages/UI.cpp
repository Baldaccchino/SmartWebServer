#include "./UI.h"
#include "./Pages.common.h"

void handleNewUi()
{
  www.sendHeader("Content-Encoding", "gzip");
  www.sendHeader("Cache-Control", "no-cache");
  www.send_P(200, "text/html", new_ui, html_len);
}