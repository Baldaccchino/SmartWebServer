<template lang="pug">
Widget(width="half")
  template(#heading) {{ title }}

  Modal(ref="confirm")
    template(#title) Are you sure?
    template(#body)
      p This will save the current telescope location as the new park location.
      p This cannot be undone.

  .flex.justify-center.mb-6
    Toggle(
      :modelValue="status.status.parked"
      :onChange="parkUnpark"
    )

  .flex.justify-center
    ControlButton(
      @click="setParkLocation"
      :disabled="status.status.parked"
      :loading="settingParkLocation"
    ) Set park location
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Widget from "../components/Widget.vue";
import Toggle from "../components/Toggle.vue";
import { type ValidMountStatus } from "../types";
import ControlButton from "../components/ControlButton.vue";
import Modal from "../components/Modal.vue";
import { useLoading } from "../composables/loading";
import { useOnstep } from "../composables/useOnstep";

const { control } = useOnstep();
const props = defineProps<{
  status: ValidMountStatus;
}>();

const settingParkLocation = ref(false);
const confirm = ref<InstanceType<typeof Modal>>(null!);

function parkUnpark(v: boolean) {
  return v ? control.park() : control.unPark();
}

const title = computed(() =>
  props.status.status.parked ? "Parked" : "Not Parked"
);

function setParkLocation() {
  return useLoading(settingParkLocation, async () => {
    if (!(await confirm.value.awaitAnswer())) {
      return;
    }

    await control.setParkingLocation();
  });
}
</script>
