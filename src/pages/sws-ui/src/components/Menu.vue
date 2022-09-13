<template lang="pug">
Menu.relative.inline-block.text-left(
  as="div"
)
  .flex.flex-col.justify-center
    MenuButton
      slot(name="button")

  transition(
    enter-active-class="transition ease-out duration-100" 
    enter-from-class="transform opacity-0 scale-95" 
    enter-to-class="transform opacity-100 scale-100" 
    leave-active-class="transition ease-in duration-75" 
    leave-from-class="transform opacity-100 scale-100" 
    leave-to-class="transform opacity-0 scale-95"
  )
    MenuItems.origin-top-right.absolute.right-0.mt-2.w-56.rounded-md.shadow-lg.bg-white.ring-1.ring-black.ring-opacity-5.focus_outline-none.py-1
      template(v-for="item in items")
        RouterLink(
          v-if="item.type === 'router'"
          :to="item.route"
          custom
          v-slot="{ href, navigate }"
        )
          MenuItem.text-sm.py-2.px-3.text-right(
            :href="href" @click="navigate"
            v-slot="{ active }"
          ) 
            .flex.space-x-5.cursor-pointer(
              :class="[ active ? 'bg-rose-500 text-white' : 'text-gray-700']"
            )
              component.h-5.w-5(
                :is="item.icon"
                v-if="item.icon"
              )
              a {{ item.title }}

        MenuItem.text-sm.py-2.px-3.text-right(
          v-slot="{ active }"
          v-else
        )
          a.flex.space-x-5.cursor-pointer(
            :class="[ active ? 'bg-rose-500 text-white' : 'text-gray-700']"
            v-if="item.type === 'link'"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
          )
            component(:is="item.icon" v-if="item.icon").h-5.w-5.mr-5
            | {{ item.title }}


          a.flex.space-x-5.cursor-pointer(
            :class="[ active ? 'bg-rose-500 text-white' : 'text-gray-700']"
            v-else
          )
            component(:is="item.icon" v-if="item.icon").h-5.w-5.mr-5
            | {{ item.title }}


</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import type { FunctionalComponent } from "vue";

type BaseLink = {
  icon?: FunctionalComponent;
  title: string;
};

type RouterLink = {
  type: "router";
  route: any;
};

type Link = {
  type: "link";
  newTab?: boolean;
  url: string;
};

type Info = {
  type: "info";
};
type MenuItem = (RouterLink | Link | Info) & BaseLink;

defineProps<{
  items: MenuItem[];
}>();
</script>
