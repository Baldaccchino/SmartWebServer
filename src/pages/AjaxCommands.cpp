#include "./Pages.common.h"
#include "../lib/tasks/OnTask.h"

void sendVersionHeader()
{
    www.sendHeader("x-sws-version", firmwareVersion.str);
}

/**
 * Batch up to 100 commands in one HTTP request
 * Each command should be cmd_${number}.
 * SWS will execute the command and return the responses under:
 * cmd_${number}|${response}
 */
void ajaxRunCommands()
{
    String cmd;
    String cmdBase = "cmd_";
    String data;
    char result[40] = "";
    char cmdBuffer[40] = "";

    for (int i = 0; i < 100; i++) {
        cmd = www.arg(cmdBase + i);

        if (cmd == "") continue;

        cmd.toCharArray(cmdBuffer, 40);
        onStep.command(cmdBuffer, result);
        sprintf(cmdBuffer, "cmd_%d|%s\n", i, result);
        data += cmdBuffer;
        Y;
    }
    
    sendVersionHeader();
    www.send(200, "text/plain", data);
}

void ajaxLibrary() {
    int cat = www.arg("cat").toInt();
    char temp[40]="";
    String data = "";

    sprintf(temp,":Lo%ld#",(long)cat-1);

    if (onStep.commandBool(temp)) {
        while (true) {
            onStep.command(":LR#",temp);

            if (temp[0] == ',') break;
            if (temp[0] == 0)  break;
            data += temp;
            data += "\n";
        }
    }

    sendVersionHeader();
    www.send(200, "text/plain", data);
}