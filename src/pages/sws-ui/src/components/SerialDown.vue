<template lang="pug">
Widget
  .text-red-300.flex.justify-center
    EyeSlashIcon.h-20.w-20

  h1.text-center.text-lg.text-yellow-200 Serial Interface to OnStep is Down!

  .mx-6.flex.flex-col.space-y-4
    p If you just rebooted OnStep please wait for several seconds for everything to startup again, then check to be sure you're still connected to WiFi.

    p If this is a persistant problem here are other possible causes:

    ul.list-disc.flex.flex-col.space-y-2.mx-6
      li Baud rate mismatch due to reboot of only OnStep, power everything off/on again.
      li Incorrectly configured SWS baud rate.
      li Incorrectly configured OnStep baud rate.
      li Incorrect wiring of the com ports.
      li Incorrect wiring of power supply pins. Gnd must be shared between OnStep's MCU and the Addon's MCU.

</template>
<script setup lang="ts">
import { EyeSlashIcon } from "@heroicons/vue/24/outline";
import Widget from "./Widget.vue";
</script>
