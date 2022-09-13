<template lang="pug">
Widget(width="half")
  Modal(ref="confirm")
    template(#title) Are you sure?
    template(#body)
      p This will re-set your mount's home position and cannot be undone.
      p This will also briefly reset your mount. 

  template(#heading) {{ title }}

  .flex.justify-center.mb-6
    Toggle(
      :modelValue="status.status.home"
      :onChange="goHome"
    )

  .flex.justify-center.space-x-2
    ControlButton(
      :loading="settingHome"
      @click="setHome"
    ) Set home

    ControlButton(
      :loading="continuingGoTo"
      :disabled="!status.status.waitingAtHome"
      v-if="mountHasCompensation(status.mount)"
      @click="continueGoTo"
    ) Continue GoTo
      ClockIcon.h-5.w-5.text-white.ml-2(v-if="status.status.waitingAtHome")


</template>

<script setup lang="ts">
import Widget from "../components/Widget.vue";
import { type ValidMountStatus, mountHasCompensation } from "../types";
import { computed, ref } from "vue";
import ControlButton from "../components/ControlButton.vue";
import Modal from "../components/Modal.vue";
import Toggle from "../components/Toggle.vue";
import { ClockIcon } from "@heroicons/vue/24/outline";
import { useLoading } from "../composables/loading";
import { useOnstep } from "../composables/useOnstep";

const { control } = useOnstep();
const confirm = ref<InstanceType<typeof Modal>>(null!);

const props = defineProps<{
  status: ValidMountStatus;
}>();

const homing = ref(false);
const settingHome = ref(false);
const continuingGoTo = ref(false);

const title = computed(() =>
  props.status.status.home ? "Homed" : "Not Homed"
);

function continueGoTo() {
  return useLoading(continuingGoTo, () => control.continueGoTo());
}

async function goHome() {
  const fn = props.status.status.home
    ? () => control.startTracking()
    : () => control.goHome();

  return useLoading(homing, fn);
}

async function setHome() {
  if (!(await confirm.value.awaitAnswer())) {
    return;
  }

  return useLoading(settingHome, () => control.setNewHome());
}
</script>
