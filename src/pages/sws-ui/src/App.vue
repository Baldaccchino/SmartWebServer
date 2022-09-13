<template lang="pug">
FullScreen(v-if="networkError")
  .flex.justify-center
    NetworkDown

FullScreen(v-else-if="!status")
  LoadingSpinner
    | Connecting to OnStep...

FullScreen(v-else-if="status.type === 'invalid'")
  .flex.justify-center
    SerialDown

.min-h-screen.flex.flex-col(v-else-if="status")
  Navbar.mb-5(
    :version="status.version"
    :status="status"
  )
  RouterView.mx-2.2xl_mx-60.xl_mx-40.md_mx-20.sm_mx-10.grow(
    v-slot="{ Component }"
  )
    component(
      :status="status"
      :is="Component"
    )

</template>

<script setup lang="ts">
import { onBeforeUnmount } from "vue";
import { useOnstep } from "./composables/useOnstep";
import Navbar from "./components/Navbar.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import FullScreen from "./components/FullScreen.vue";
import SerialDown from "./components/SerialDown.vue";
import NetworkDown from "./components/NetworkDown.vue";

const { status, networkError, onStep } = useOnstep();

onBeforeUnmount(() => onStep.disconnect());
</script>
