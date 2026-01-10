import { h, render, type Directive, type DirectiveBinding } from 'vue';
import Tooltip from '../components/UI/Tooltip.vue';

interface TooltipOptions {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
}

const tooltipInstances = new Map<HTMLElement, { container: HTMLElement; show: () => void; hide: () => void }>();

const vTooltip: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const options: TooltipOptions = typeof binding.value === 'string'
      ? { text: binding.value }
      : binding.value;

    const container = document.createElement('div');
    const vnode = h(Tooltip, {
      text: options.text,
      target: el,
      position: options.position || (binding.modifiers.top ? 'top' : binding.modifiers.bottom ? 'bottom' : binding.modifiers.left ? 'left' : binding.modifiers.right ? 'right' : 'top'),
      trigger: options.trigger || 'hover',
      delay: options.delay !== undefined ? options.delay : 200
    });

    render(vnode, container);

    // @ts-ignore
    const component = vnode.component?.exposed;

    if (component) {
      tooltipInstances.set(el, {
        container,
        show: component.show,
        hide: component.hide
      });
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding) {
    const instance = tooltipInstances.get(el);
    if (instance) {
      // Re-mount if value changed
      const options: TooltipOptions = typeof binding.value === 'string'
        ? { text: binding.value }
        : binding.value;

      const vnode = h(Tooltip, {
        text: options.text,
        target: el,
        position: options.position || (binding.modifiers.top ? 'top' : binding.modifiers.bottom ? 'bottom' : binding.modifiers.left ? 'left' : binding.modifiers.right ? 'right' : 'top'),
        trigger: options.trigger || 'hover',
        delay: options.delay !== undefined ? options.delay : 200
      });

      render(vnode, instance.container);
    }
  },

  unmounted(el: HTMLElement) {
    const instance = tooltipInstances.get(el);
    if (instance) {
      render(null, instance.container);
      tooltipInstances.delete(el);
    }
  }
};

export default vTooltip;
