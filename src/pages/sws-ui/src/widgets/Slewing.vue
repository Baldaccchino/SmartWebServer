<template lang="pug">
Widget(width="full")
  template(#heading) Guiding
  template(#subheading) 
    p Use these tools to manually slew your scope (must be tracking)
    p Use the center button to sync on a star if you've adjusted the location.

  .flex.justify-center
    .w-full.flex.justify-center(class="md_w-1/2 xl_w-1/3")
      ControlButton(
        @click="doSearch"
        :disabled="!canSlew"
        v-if="!search"
      ) Search

      ControlButton(
        @click="stopSearch"
        v-else
      ) Stop search

  .flex.justify-center
    .grid.grid-cols-3.gap-4.select-none.mb-8.w-full(class="md_w-1/2 xl_w-1/3")
      ControlButton(
        @mousedown="slew(['n', 'e'])"
        @mouseup="stop(['n', 'e'])"
        :disabled="!canSlew"
      ) NE
 
      ControlButton(
        @mousedown="slew(['n'])"
        @mouseup="stop(['n'])"
        :disabled="!canSlew"
      ) N

      ControlButton(
        @mousedown="slew(['n', 'w'])"
        @mouseup="stop(['n', 'w'])"
        :disabled="!canSlew"
      ) NW

      ControlButton(
        @mousedown="slew(['e'])"
        @mouseup="stop(['e'])"
        :disabled="!canSlew"
      ) E

      ControlButton(
        @click="sync"
        :loading="syncing"
        :disabled="!canSlew"
      ) 
        ArrowPathIcon.w-5.h-5

      ControlButton(
        @mousedown="slew(['w'])"
        @mouseup="stop(['w'])"
        :disabled="!canSlew"
      ) W

      ControlButton(
        @mousedown="slew(['s', 'e'])"
        @mouseup="stop(['s', 'e'])"
        :disabled="!canSlew"
      ) SE

      ControlButton(
        @mousedown="slew(['s'])"
        @mouseup="stop(['s'])"
        :disabled="!canSlew"
      ) S

      ControlButton(
        @mousedown="slew(['s', 'w'])"
        @mouseup="stop(['s', 'w'])"
        :disabled="!canSlew"
      ) SW

  Heading Speed
  .flex.justify-center.space-x-2
    Toggles(
      :options="speedOptions"
      :value="status.slewing.speed"
      :onChange="speedChange"
    )

  .flex.justify-center.space-x-2
    Toggles(
      :options="maxSlewOptions"
      :value="status.slewing.maxSpeed"
      :onChange="changeSlewingSpeed"
    )

</template>

<script setup lang="ts">
import Widget from "../components/Widget.vue";
import Heading from "../components/Heading.vue";
import ControlButton from "../components/ControlButton.vue";
import { ArrowPathIcon } from "@heroicons/vue/24/outline";
import Toggles from "../components/Toggles.vue";
import {
  type Direction,
  type ValidMountStatus,
  type MaxSlewSpeed,
} from "../types";
import { MountControl } from "../onstep/control";
import { computed, ref, onBeforeUnmount } from "vue";
import type { Search } from "../onstep/search";

const props = defineProps<{
  control: MountControl;
  status: ValidMountStatus;
}>();

function changeSlewingSpeed(speed: MaxSlewSpeed) {
  return props.control.changeMaxSlewSpeed(speed);
}

const maxSlewOptions = ref([
  {
    title: "0.5x",
    value: "vs",
  },
  {
    title: "0.75x",
    value: "s",
  },
  {
    title: "1x",
    value: "n",
  },
  {
    title: "1.5x",
    value: "f",
  },
  {
    title: "2x",
    value: "vf",
  },
]);
const search = ref<Search | null>(null);

function doSearch() {
  search.value = props.control.makeSearcher();
  search.value.search();
}

function stopSearch() {
  search.value?.stop();
  search.value = null;
}

onBeforeUnmount(() => stopSearch());
const canSlew = computed(() => {
  if (search.value) {
    return false;
  }

  return props.status.status.tracking || props.status.status.aligning;
});

const syncing = ref(false);

const speedOptions = ["V. Slow", "Slow", "Normal", "Fast", "V. Fast"].map(
  (opt, i) => ({
    title: opt,
    value: [0, 2, 4, 6, 8][i],
  })
);

async function sync() {
  try {
    syncing.value = true;
    await props.control.syncWith();
  } finally {
    syncing.value = false;
  }
}

function slew(dirs: Direction[]) {
  return Promise.all(dirs.map((dir) => props.control.slew(dir, true)));
}
function stop(dirs: Direction[]) {
  return Promise.all(dirs.map((dir) => props.control.slew(dir, false)));
}

function speedChange(speed: number) {
  return props.control.changeSpeed(speed);
}
</script>
