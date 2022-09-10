<template lang="pug">
Widget(width="half")
  template(#heading)
    template(v-if="!aligning") Alignment
    template(v-else) 
      .flex.flex-col
        | Alignment in progress
        small.flex.justify-center (on star {{ currentStar }} of {{ alignmentStars }})
  template(#subheading) 
    template(v-if="!aligning") Once at home, you can perform a 1-9 star alignment.
    template(v-else-if="status.status.slewing")  Wait for the mount to finish moving. 
    template(v-else) Guide your mount to center the object. Then click accept.


  .flex.space-x-2.justify-center
    template(v-if="!aligning")
      ControlButton.flex(
        :disabled="!status.status.home"
        :loading="loading === star"
        :active="star === alignmentStars"
        v-for="star in [1,3,9]"
        @click="align(star)"
      )
        | {{ star }}
        StarIcon.h-4.w-5

    .flex.space-x-2(v-else)
      ControlButton.flex(
        :loading="loading !== null"
        @click="accept"
        :disabled="status.status.slewing"
      ) Accept star {{ currentStar }}

      //- todo: 'refine alignment for mount type != alt_az
</template>

<script setup lang="ts">
import Widget from "../components/Widget.vue";
import { StarIcon } from "@heroicons/vue/24/solid";
import { type ValidMountStatus } from "../types";
import { MountControl } from "../onstep/control";
import ControlButton from "../components/ControlButton.vue";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const props = defineProps<{
  control: MountControl;
  status: ValidMountStatus;
}>();

const currentStar = computed(() => props.status.alignment.currentStar);
const alignmentStars = computed(() => props.status.alignment.lastRequiredStar);
const aligning = computed(() => props.status.status.aligning);
const loading = ref<null | number>(null);

async function accept() {
  loading.value = alignmentStars.value;
  try {
    await props.control.nextStarAlignment();

    if (currentStar.value < alignmentStars.value + 1) {
      router.push({ name: "library" });
    }
  } finally {
    loading.value = null;
  }
}

async function align(stars: number) {
  loading.value = stars;
  try {
    await props.control.startAlignment(stars);
    router.push({ name: "library" });
  } finally {
    loading.value = null;
  }
}
</script>
