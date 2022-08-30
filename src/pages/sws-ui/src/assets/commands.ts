// TODO: it would be nice to reference this in the terminal view.
export const commands = {
  ":SCMM/DD/YY#": "Set date",
  ":GC#": "Get date",
  ":SLHH:MM:SS#": "Set time (Local)",
  ":Ga#": "Get time (Local, 12hr format)",
  ":GL#": "Get time (Local, 24hr format)",
  ":SSHH:MM:SS#": "Set time (Sidereal)",
  ":GS#": "Get time (Sidereal)",
  ":SGsHH#": "Set UTC Offset(for current site)",
  ":GG#": "Get UTC Offset(for current site)",
  ":StsDD*MM#": "Set Latitude (for current site)",
  ":Gt#": "Get Latitude (for current site)",
  ":SgDDD*MM#": "Set Longitude (for current site)",
  ":Gg#": "Get Longitude (for current site)",
  ":SMsss...#": "Set site 0 name",
  ":SNsss...#": "Set site 1 name",
  ":SOsss...#": "Set site 2 name",
  ":SPsss...#": "Set site 3 name",
  ":GM#": "Get site 0 name",
  ":GN#": "Get site 1 name",
  ":GO#": "Get site 2 name",
  ":GP#": "Get site 3 name",
  ":Wn#": "Select site n (0-3)",
  ":SrHH:MM:SS# *": "Set target RA",
  ":Gr#": "Get target RA",
  ":SdsDD:MM:SS# *": "Set target Dec",
  ":Gd#": "Get target Dec",
  ":SzDDD:MM:SS# *": "Set target Azm",
  ":SasDD:MM:SS# *": "Set target Alt",
  ":GR#": "Get telescope RA",
  ":GD#": "Get telescope Dec",
  ":GZ#": "Get telescope Azm",
  ":GA#": "Get telescope Alt",
  ":ShsDD#": "Set horizon limit",
  ":GhsDD#": "Get horizon limit",
  ":SoDD#": "Set overhead limit",
  ":GoDD#": "Get overhead limit",
  ":MS#": "Move telescope (to current Equ target)",
  ":MA#": "Move telescope (to current Hor target)",
  ":Q#": "Stop telescope",
  ":Me#": "Move telescope east (at current rate)",
  ":Mw#": "Move telescope west (at current rate)",
  ":Mn#": "Move telescope north (at current rate)",
  ":Ms#": "Move telescope south (at current rate)",
  ":Qe#": "Stop moving east",
  ":Qw#": "Stop moving west",
  ":Qn#": "Stop moving north",
  ":Qs#": "Stop moving south",
  ":Mgdnnnn#":
    "Pulse guide (at current rate):\nd=n,s,e,w\nnnnn=time in mS\n(from 20 to 16399mS)",
  ":RG#": "Set rate to Guide",
  ":RC#": "Set rate to Centering",
  ":RM#": "Set rate to Move",
  ":RS#": "Set rate to Slew",
  ":Rn#": "Set rate to n (0-9)*3",
  ":D#": "Get distance bars (indicates slew)",
  ":Gm#": "Pier side",
  ":STdd.ddddd#": "Set sidereal rate RA",
  ":GT#": "Get sidereal rate RA",
  ":TQ#": "Track sidereal rate RA (default)",
  ":TR#": "Track sidereal rate reset",
  ":T+#": "Track rate increase 0.02Hz",
  ":T-#": "Track rate decrease 0.02Hz",
  ":TS#": "Track solar rate RA",
  ":TL#": "Track lunar rate RA",
  ":TK#": "Track king rate RA",
  ":Te#": "Tracking enable",
  ":Td#": "Tracking disable",
  ":Tr#": "Refraction rate tracking",
  ":Tn#": "No refraction rate tracking",
  ":CS#": "Sync. with current target RA/Dec",
  ":CM#": "Sync. with current target RA/Dec",
  ":Lonn#": "Select catalog no.",
  ":LB#": "Move Back in catalog",
  ":LN#": "Move to Next in catalog",
  ":LCnnnn#": "Move to catalog item no.",
  ":L$#": "Move to catalog name rec.",
  ":LI#": "Get catalog item id.",
  ":LR#": "Read catalog item info.\n(also moves forward)",
  ":LWssss,ttt#":
    "Write catalog item info.\nssss=name, ttt=type code:\nUNK,OC,GC,PN,DN,SG,EG,IG,KNT,SNR,GAL,CN,STR,PLA,CMT,AST",
  ":LD#": "Clear current record",
  ":LL#": "Clear current cataLog",
  ":L!#": "Clear all catalogs",
  ":$BRnnn#": "Set RA (Azm) backlash amount (in ArcSec)",
  ":$BDnnn#": "Set Dec (Alt) backlash amount (in ArcSec)",
  ":$QZ+#": "Turn PEC on",
  ":$QZ-#": "Turn PEC off",
  ":$QZZ#": "Clear PEC data",
  ":$QZ/#": "Start recording PEC",
  ":$QZ!#": "Save PEC data/settings to EEPROM",
  ":$QZ?#":
    "Get PEC status returns:\nI-Ignore PEC,\nP-Playing PEC, p-Getting ready to play PEC,\nR-Record PEC, r-Getting ready to record PEC",
  ":VRnnnn#": "Readout PEC data",
  ":VR#":
    "Readout PEC data at current index (while playing/recording),\nalso returns index",
  ":WRnnnn,sddd#": "Write PEC data",
  ":AW#": "Align, write model to EEPROM",
  ":A1#": "Align, one-star*4",
  ":A2# (:A3#, etc.)": "Align, two or more star*4",
  ":A+#": "Align, accept*4",
  ":hQ#": "Set park position",
  ":hP#": "Move to park position",
  ":hR#": "Restore parked telescope to operation",
  ":hF#": "Set home (CWD)",
  ":hC#": "Move to home (CWD)",
  ":FA#": "Focuser1 Active?",
  ":fA#": "Focuser2 Active?",
  ":FA[n]#": "Select primary focuser n = 1 or 2",
  ":Fa#": "Get primary focuser",
  ":FT#": "Get status M# = moving, S# = stopped",
  ":FI#": "Get full in position (in microns or steps)",
  ":FM#": "Get max position (in microns or steps)",
  ":Fe#": "Get focuser temperature differential",
  ":Ft#": "Get focuser temperature",
  ":Fu#": "Get focuser microns per step",
  ":FB#": "Get focuser backlash amount (in microns or steps)",
  ":FB[n]#": "Set focuser backlash amount (in microns or steps)",
  ":FC#": "Get focuser temperature compensation coefficient",
  ":FC[sn.n]#": "Set focuser temperature compensation coefficient",
  ":Fc#": "Get focuser temperature compensation coefficient enable status",
  ":Fc[n]#": "Enable/disable focuser temperature compensation [n] = 0 or 1",
  ":FD#": "Get focuser temperature compensation deadband amount",
  ":FD[n]#": "Set focuser temperature compensation deadband amount",
  ":FP#": "Get focuser DC Motor Power Level (in %)",
  ":FQ#": "Stops the focuser",
  ":FF#": "Set focuser for fast motion (1mm/s)",
  ":FS#": "Set focuser for slow motion (0.01mm/s)",
  ":F[n]#": "Set focuser move rate",
  ":F+#": "Move focuser in (toward objective)",
  ":F-#": "Move focuser out (away from objective)",
  ":FG#": "Get focuser current position (in microns or steps)",
  ":FR[sn]#": "Set focuser target position relative (in microns or steps)",
  ":FS[n]#": "Set focuser target position (in microns or steps)",
  ":FZ#": "Set focuser position as zero",
  ":FH#": "Set focuser position as half-travel",
  ":Fh#": "Set focuser target position at half-travel",
  ":B+#": "Increase reticule Brightness",
  ":B-#": "Decrease reticule Brightness",
  ":ERESET#":
    "Reset controller (must be at home or parked)\nOnStepX only, works for all platforms.",
  ":ENVRESET#": "Reset NV (EEPROM)",
  ":SBn#":
    "Set baud rate:\n1=56.7K, 2=38.4K, 3=28.8K,\n4=19.2K, 5=14.4K, 6=9600,\n7=4800, 8=2400, 9=1200",
  ":U#": "Precision toggle",
  ":GVD#": "Get firmware date",
  ":GVT#": "Get firmware time",
  ":GVN#": "Get firmware number",
  ":GVP#": "Get firmware name",
  ":GU#":
    "Get statUs returns:\nN-Not slewing, H-At Home position,\nP-Parked, p-Not parked, F-Park Failed,\nI-park In progress, R-PEC Recorded\nG-Guiding in progress, S-GPS PPS Synced",
};
