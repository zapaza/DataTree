<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
        @click="$emit('close')"
      />
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="show"
        class="fixed bottom-0 left-0 right-0 z-[160] bg-base border-t border-base rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <!-- Handle for dragging (visual only) -->
        <div class="h-1.5 w-12 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-2 shrink-0" />

        <div class="p-4 border-b border-light flex items-center justify-between bg-secondary shrink-0">
          <h3 class="font-bold text-base flex items-center gap-2">
            <slot name="title">Settings & Filters</slot>
          </h3>
          <button
            class="p-2 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded-full transition-colors"
            @click="$emit('close')"
          >
            <div class="i-carbon-close text-xl" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
}>();

defineEmits(['close']);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
