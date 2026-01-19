<template>
  <div class="p-4 space-y-4">
    <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
      <div class="i-carbon-list" />
      Graph Legend
    </h3>

    <div class="space-y-2">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
        <span class="text-[10px] font-bold text-muted uppercase">Object</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full bg-indigo-500 shadow-sm" />
        <span class="text-[10px] font-bold text-muted uppercase">Array</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
        <span class="text-[10px] font-bold text-muted uppercase">Value</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
