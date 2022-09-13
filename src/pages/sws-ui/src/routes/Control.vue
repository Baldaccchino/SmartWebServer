<template lang="pug">
.flex.flex-col.space-y-2
  Columns
    Homing(:status="status")
    Parking(:status="status")

  Columns
    Tracking(:status="status")
    Alignment(:status="status")

  Slewing(:status="status")

</template>

<script setup lang="ts">
import { type ValidMountStatus } from "../types";
import Tracking from "../widgets/Tracking.vue";
import Parking from "../widgets/Parking.vue";
import Homing from "../widgets/Homing.vue";
import Slewing from "../widgets/Slewing.vue";
import Alignment from "../widgets/Alignment.vue";
import Columns from "../components/Columns.vue";

defineProps<{
  status: ValidMountStatus;
}>();
</script>
