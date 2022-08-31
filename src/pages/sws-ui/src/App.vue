<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { api } from "./api/api";
import { MountControl } from "./api/control";
import { type MountStatus } from "./types";
import Navbar from "./components/Navbar.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import FullScreen from "./components/FullScreen.vue";
import SerialDown from "./components/SerialDown.vue";
import { toast } from "./utils/toast";
import NetworkDown from "./components/NetworkDown.vue";

const router = useRouter();
const status = ref<null | MountStatus>(null);
const networkError = ref(false);

const control = new MountControl(
  api
    .onNetworkDown(() => {
      networkError.value = true;
    })
    .onNetworkUp(() => {
      networkError.value = false;
    }),
  (error) => toast(error, "error")
)
  .startHeartbeat((s) => (status.value = s))
  .onAfterGoto(() => router.push({ name: "control" }));
onBeforeUnmount(() => control.stopHeartbeat());
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
