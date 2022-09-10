<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { api } from "./api/api";
import { OnStep } from "./onstep/onStep";
import { MountControl } from "./onstep/control";
import Navbar from "./components/Navbar.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import FullScreen from "./components/FullScreen.vue";
import SerialDown from "./components/SerialDown.vue";
import { toast } from "./utils/toast";
import NetworkDown from "./components/NetworkDown.vue";
import type { MountStatus } from "./types";

const router = useRouter();
const networkError = ref(false);
const status = ref<MountStatus | null>(null);

const onError = (e: string) => toast(e, "error");

api
  .onNetworkDown(() => {
    networkError.value = true;
  })
  .onNetworkUp(() => {
    networkError.value = false;
  });

const onStep = new OnStep(api, onError).onStatusUpdate(
  (s) => (status.value = s)
);
onBeforeUnmount(() => onStep.disconnect());

const control = new MountControl(api, onStep, onError)
  // after a goto, the user probably wants to be back on the control page.
  // we'll push them to the control page after a goto completion.
  .onAfterGoto(() => router.push({ name: "control" }));
</script>

<template lang="pug">
FullScreen(v-if="networkError")
  .flex.justify-center
    NetworkDown

FullScreen(v-else-if="!status")
  LoadingSpinner
    | connecting..

FullScreen(v-else-if="status.type === 'invalid'")
  .flex.justify-center
    SerialDown

.min-h-screen.flex.flex-col(v-else-if="status")
  Navbar.mb-5(
    :version="status.version"
    :control="control"
    :status="status"
  )
  RouterView.mx-2.2xl_mx-60.xl_mx-40.md_mx-20.sm_mx-10.grow(
    v-slot="{ Component }"
  )
    component(
      :status="status"
      :control="control"
      :is="Component"
    )

</template>

<style scoped></style>
