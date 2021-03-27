// -----------------------------------------------------------------------------------
// Misc functions to help with commands, etc.
#pragma once

#include <Arduino.h>

typedef struct AxisSettings {
   double stepsPerMeasure;
   int16_t microsteps;
   int16_t IRUN;
   int8_t reverse;
   int16_t min;
   int16_t max;
} AxisSettings;

// remove leading and trailing 0's
void stripNum(char* s);

// integer numeric conversion with error checking
bool atoi2(char *a, int *i);

// convert to various degrees, minutes, seconds formats
boolean doubleToDms(char *reply, double *f, boolean fullRange, boolean signPresent);

// convert time to compact byte representation for intervalometer
uint8_t timeToByte(float t);

// convert compact byte representation to time for intervalometer
float byteToTime(uint8_t b);

// convert axis settings string into numeric form
bool decodeAxisSettings(char* s, AxisSettings* a);

// validate axis settings for a given axis and mount type
bool validateAxisSettings(int axisNum, boolean altAz, AxisSettings a);

// return temperature string with proper value and units for this locale
void localeTemperature(char* temperatureStr, char* units);

// return pressure string with proper value and units for this locale
void localePressure(char* pressureStr, char* units);