<template>
  <Teleport to="body">
    <Transition name="tooltip">
      <div
        v-if="isVisible"
        ref="tooltipRef"
        class="fixed z-[9999] px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded shadow-lg pointer-events-none max-w-[300px] break-words"
        :style="tooltipStyle"
        role="tooltip"
        :aria-hidden="!isVisible"
      >
        {{ text }}
        <!-- Arrow -->
        <div
          ref="arrowRef"
          class="absolute w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"
          :style="arrowStyle"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed, type PropType } from 'vue';

type TTooltipPosition = 'top' | 'bottom' | 'left' | 'right';
type TTooltipTrigger = 'hover' | 'click' | 'focus';

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  target: {
    type: [Object, HTMLElement] as PropType<HTMLElement | null>,
    default: null
  },
  position: {
    type: String as PropType<TTooltipPosition>,
    default: 'top'
  },
  trigger: {
    type: String as PropType<TTooltipTrigger>,
    default: 'hover'
  },
  delay: {
    type: Number,
    default: 200
  }
});

const isVisible = ref(false);
const tooltipRef = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);
const coords = ref({ top: 0, left: 0 });
const actualPosition = ref<TTooltipPosition>(props.position);
const arrowStyle = ref({});

let timer: number | null = null;

const show = () => {
  if (timer) clearTimeout(timer);
  timer = window.setTimeout(() => {
    isVisible.value = true;
    nextTick(() => {
      calculatePosition();
    });
  }, props.delay);
};

const hide = () => {
  if (timer) clearTimeout(timer);
  isVisible.value = false;
};

const toggle = () => {
  if (isVisible.value) hide();
  else show();
};

const calculatePosition = () => {
  if (!props.target || !tooltipRef.value) return;

  const targetRect = props.target.getBoundingClientRect();
  const tooltipRect = tooltipRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = 0;
  let left = 0;
  let pos = props.position;

  // Auto-flip logic
  if (pos === 'top' && targetRect.top - tooltipRect.height - 10 < 0) {
    pos = 'bottom';
  } else if (pos === 'bottom' && targetRect.bottom + tooltipRect.height + 10 > viewportHeight) {
    pos = 'top';
  } else if (pos === 'left' && targetRect.left - tooltipRect.width - 10 < 0) {
    pos = 'right';
  } else if (pos === 'right' && targetRect.right + tooltipRect.width + 10 > viewportWidth) {
    pos = 'left';
  }

  actualPosition.value = pos;

  // Initial calculation based on position
  if (pos === 'top') {
    top = targetRect.top - tooltipRect.height - 8;
    left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
  } else if (pos === 'bottom') {
    top = targetRect.bottom + 8;
    left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
  } else if (pos === 'left') {
    top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
    left = targetRect.left - tooltipRect.width - 8;
  } else if (pos === 'right') {
    top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
    left = targetRect.right + 8;
  }

  // Viewport constraints (boundary adjustment)
  if (left < 4) left = 4;
  if (left + tooltipRect.width > viewportWidth - 4) {
    left = viewportWidth - tooltipRect.width - 4;
  }
  if (top < 4) top = 4;
  if (top + tooltipRect.height > viewportHeight - 4) {
    top = viewportHeight - tooltipRect.height - 4;
  }

  coords.value = { top, left };

  // Arrow position
  if (pos === 'top') {
    arrowStyle.value = {
      bottom: '-4px',
      left: `${Math.max(4, Math.min(tooltipRect.width - 12, targetRect.left - left + targetRect.width / 2 - 4))}px`
    };
  } else if (pos === 'bottom') {
    arrowStyle.value = {
      top: '-4px',
      left: `${Math.max(4, Math.min(tooltipRect.width - 12, targetRect.left - left + targetRect.width / 2 - 4))}px`
    };
  } else if (pos === 'left') {
    arrowStyle.value = {
      right: '-4px',
      top: `${Math.max(4, Math.min(tooltipRect.height - 12, targetRect.top - top + targetRect.height / 2 - 4))}px`
    };
  } else if (pos === 'right') {
    arrowStyle.value = {
      left: '-4px',
      top: `${Math.max(4, Math.min(tooltipRect.height - 12, targetRect.top - top + targetRect.height / 2 - 4))}px`
    };
  }
};

const tooltipStyle = computed(() => ({
  top: `${coords.value.top}px`,
  left: `${coords.value.left}px`
}));

const setupListeners = () => {
  if (!props.target) return;

  if (props.trigger === 'hover') {
    props.target.addEventListener('mouseenter', show);
    props.target.addEventListener('mouseleave', hide);
  } else if (props.trigger === 'click') {
    props.target.addEventListener('click', toggle);
    document.addEventListener('click', handleOutsideClick);
  } else if (props.trigger === 'focus') {
    props.target.addEventListener('focus', show);
    props.target.addEventListener('blur', hide);
  }

  window.addEventListener('scroll', calculatePosition, true);
  window.addEventListener('resize', calculatePosition);
};

const removeListeners = () => {
  if (!props.target) return;

  props.target.removeEventListener('mouseenter', show);
  props.target.removeEventListener('mouseleave', hide);
  props.target.removeEventListener('click', toggle);
  props.target.removeEventListener('focus', show);
  props.target.removeEventListener('blur', hide);
  document.removeEventListener('click', handleOutsideClick);
  window.removeEventListener('scroll', calculatePosition, true);
  window.removeEventListener('resize', calculatePosition);
};

const handleOutsideClick = (e: MouseEvent) => {
  if (props.target && !props.target.contains(e.target as Node) && isVisible.value) {
    hide();
  }
};

onMounted(() => {
  if (props.target) {
    setupListeners();
    // A11y
    props.target.setAttribute('aria-describedby', 'tooltip');
  }
});

onUnmounted(() => {
  removeListeners();
});

watch(() => props.target, (newTarget, oldTarget) => {
  if (oldTarget) removeListeners();
  if (newTarget) setupListeners();
});

defineExpose({ show, hide });
</script>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
