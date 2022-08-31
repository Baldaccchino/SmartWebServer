<template lang="pug">
Columns
  Modal(ref="confirmRemove")
    template(#title) Are you sure?
    template(#body="{ item }") This will remove {{ item.name }} from your catalog.

  Widget
    template(#heading) Find an object
    template(#subheading) Premade library & manual GoTo's

    .flex.justify-center
      Toggles(
        :options=`[
          { title: 'All', value: 'all' },
          { title: 'Manual', value: 'manual' },
          { title: 'Bright Stars', value: 'brightStars' },
          { title: 'Messier', value: 'messier' },
        ]`
        :value="libraryType"
        :on-change="v => libraryType = v"
      )

    InputField.mb-2(
      v-model="searchValue"
      label="Filter objects"
      placeholder="Betelgeuse"
    )

    .overflow-auto.max-h-96
      .flex.text-white.my-2.space-x-3(
        v-for="(star) in filteredStars"
        :key="`${star.ra}${star.dec}`"
      ) 
        .grow.mr-4.flex.flex-col.justify-center 
          .flex {{ star.name }} 
            small.flex.flex-col.justify-center(v-if="star.source === 'manual'")
              a.ml-2.cursor-pointer(
                @click="removeFromLib(star)"
              ) (
                template(v-if="removing === star.name") removing...
                template(v-else) remove
                | )

          small.mt-1.flex ({{ star.ra }}, {{ star.dec }})

        ControlButton(
          class="w-1/3"
          @click="goTo(star)"
          :loading="loading == star.name"
        ) GoTo {{ star.name }}

  Widget
    template(#heading) Enter coordinates manually
    template(#subheading) Manual GoTo's will be saved to the library.
    .flex
      InputField.my-2(
        class="w-1/2"
        label="Name of this object"
        v-model="manualGoToName"
        placeholder="Any name you'd like!"
        :max-length="11"
      )

      .flex.flex-col.justify-end.h-full.pb-2.ml-2(
        class="w-1/2"
      )
        SelectBox(
          :items=`starSelectTypes`
          v-model="manualStarSelectType"
        )
          template(#label) Select type of object

    .flex.space-x-2.my-2
      InputField.grow(
        v-model="manualGoTo.ra"
        placeholder="00:08:23"
      )
        template(#label)
          .flex.flex-col
            | Right Ascension
            .text-sm (format: 00:08:23)


      InputField.grow(
        v-model="manualGoTo.dec"
        placeholder="+29*05:25"
      )
        template(#label)
          .flex.flex-col
            | Declination
            .text-sm (format: +29*05:25)

    ControlButton.my-4(
      @click="goTo(manualGoTo)"
      :loading="loading === manualGoTo.name"
    ) GoTo coordinates

</template>

<script setup lang="ts">
import { computed, ref, onMounted, reactive, watch } from "vue";
import Fuse from "fuse.js";
import { api } from "../api/api";
import { MountControl } from "../api/control";
import { RecentStars } from "../utils/recentStars";
import { catalog, type Star, starTypes, type StarType } from "../database";

import Widget from "../components/Widget.vue";
import InputField from "../components/InputField.vue";
import ControlButton from "../components/ControlButton.vue";
import SelectBox from "../components/SelectBox.vue";
import Modal from "../components/Modal.vue";
import Columns from "../components/Columns.vue";
import Toggles from "../components/Toggles.vue";

const { messier, brightStars } = catalog;

const props = defineProps<{
  control: MountControl;
}>();

const starSelectTypes = Object.entries(starTypes).map(([value, name]) => ({
  name,
  value,
  checked: false,
}));

const libraryType = ref<"brightStars" | "messier" | "all" | "manual">(
  (localStorage.getItem("libraryType") as any) ?? "all"
);
const savedObjects = ref<Star[]>([]);
const searchValue = ref(localStorage.getItem("searchValue") ?? "");
const loading = ref<string | null | symbol>(null);
const confirmRemove = ref<InstanceType<typeof Modal>>(null!);
const removing = ref<string | null>(null);

watch(libraryType, () => {
  localStorage.setItem("libraryType", libraryType.value);
  searchValue.value = "";
});

watch(searchValue, () => {
  localStorage.setItem("searchValue", searchValue.value);
});

function makeSearchableStars(additionalStars: Star[]) {
  return new Fuse([...additionalStars, ...brightStars, ...messier], {
    threshold: 0.3,
    keys: ["name"],
  });
}

const searchableStars = ref(makeSearchableStars([]));

const manualStarSelectType = ref<{
  value: StarType;
  name: string;
  checked: false;
}>({
  name: "Star",
  value: "STR",
  checked: false,
});

const recentStars = new RecentStars(api, (stars) => {
  savedObjects.value = stars;
  searchableStars.value = makeSearchableStars(
    stars.map((s) => ({ ...s, source: "manual" }))
  );
});

const manualGoToName = ref("");
const manualGoTo = reactive<Star>({
  name: Symbol("manual"),
  ra: "",
  dec: "",
  type: "STR",
  source: "manual",
});

const filteredStars = computed<Star[]>(() => {
  const searched = searchableStars.value
    .search(searchValue.value)
    .map((i) => i.item);

  const allTargets = [...savedObjects.value, ...brightStars, ...messier];

  // search should always show everything
  if (searchValue.value) {
    return searched;
  }

  // otherwise just show the selected group
  return allTargets.filter((s) => {
    if (libraryType.value === "all") {
      return true;
    }
    return s.source === libraryType.value;
  });
});

async function removeFromLib(star: Star) {
  if (!(await confirmRemove.value.awaitAnswer(star))) {
    return;
  }

  try {
    removing.value = star.name.toString();
    await recentStars.removeStar((s) => {
      return s.dec === star.dec && s.ra === star.ra && s.name === star.name;
    });

    await recentStars.refreshList();
  } finally {
    removing.value = null;
  }
}

async function goTo(star: Star) {
  loading.value = star.name;

  if (star.name === manualGoTo.name) {
    recentStars.addStar({
      ...manualGoTo,
      type: manualStarSelectType.value.value,
      name: manualGoToName.value,
    });

    recentStars.storeList().then(() => recentStars.refreshList());
  }

  try {
    await props.control.goToStar(star);
  } finally {
    loading.value = null;
  }
}

onMounted(() => {
  recentStars.refreshList();
});
</script>
