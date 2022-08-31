<template lang="pug">
Widget
  .text-red-300.flex.justify-center
    SignalSlashIcon.h-20.w-20

  h1.text-center.text-lg.text-yellow-200 Network connection is down!

  .mx-6.flex.flex-col.space-y-4
    p A request sent to OnStep timed out. Your network connection may be unstable.

    p If you just rebooted OnStep please wait for several seconds for everything to startup again, then check to be sure you're still connected to WiFi.

    p SmartWebServer will attempt to reconnect while you wait. 

    p You may try refreshing this page or rebooting OnStep and SWS.
    br

</template>
<script setup lang="ts">
import { SignalSlashIcon } from "@heroicons/vue/24/outline";
import Widget from "./Widget.vue";
</script>
