<template lang="pug">
button.text-center.inline-flex.items-center.text-center.justify-center.px-3.py-2.border.border-transparent.text-base.font-medium.shadow-sm.text-white.bg-rose-400.hover_bg-rose-500.focus_outline-none.transition.place-content-center.relative(
  @click="click"
  @pointerdown="down"
  @pointerup="up"
  :class="buttonClasses"
)
  .absolute.inset-0.flex.justify-center(v-show="loading")
    .flex.flex-col.justify-center
      SmallSpinner
  .flex.items-center.text-center.justify-center(
    :class="{ 'text-transparent': loading }"
  )
    slot

</template>

<script setup lang="ts">
import SmallSpinner from "./SmallSpinner.vue";
import { ref, computed } from "vue";

const props = defineProps<{
  square?: boolean;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
}>();

const emits = defineEmits<{
  (e: "click"): void;
  (e: "mousedown"): void;
  (e: "mouseup"): void;
}>();

const buttonClasses = computed(() => {
  const classes: string[] = [];

  if (!props.square) {
    classes.push("rounded-md");
  }

  if (props.active && !mouseIsDown.value && !props.disabled) {
    classes.push("bg-rose-300 border-rose-400");
  }

  if (!props.active && mouseIsDown.value) {
    classes.push("bg-rose-700 border-rose-400");
  }

  if (props.disabled) {
    classes.push("cursor-not-allowed bg-rose-200 text-rose-300");
  }

  return classes;
});

function click() {
  if (!props.disabled) {
    emits("click");
  }
}

const mouseIsDown = ref(false);

function down(e: unknown) {
  if (mouseIsDown.value) {
    return;
  }

  mouseIsDown.value = true;
  emits("mousedown");
}

function up(e: unknown) {
  if (!mouseIsDown.value) {
    return;
  }

  mouseIsDown.value = false;
  emits("mouseup");
}
</script>
