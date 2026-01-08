import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TreeNode from '../TreeNode.vue';
import type { TTreeNode } from '@/types/store';

// Mocking useSettingsStore
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    settings: {
      tree: {
        showIcons: true,
        animate: true,
      }
    }
  }))
}));

// Mocking useTreeStore
vi.mock('@/stores/treeStore', () => ({
  useTreeStore: vi.fn(() => ({
    isExpanded: vi.fn((path) => path === 'root'),
    selectedPath: null,
    searchQuery: '',
    searchResults: [],
    currentSearchIndex: -1,
    setSelectedPath: vi.fn(),
    toggleNode: vi.fn(),
  }))
}));

describe('TreeNode.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const mockNode: TTreeNode = {
    type: 'string',
    key: 'name',
    value: 'John',
  };

  it('renders key and value for simple types', () => {
    const wrapper = mount(TreeNode, {
      props: {
        node: mockNode,
        path: 'root.name',
        depth: 1
      },
      global: {
        stubs: {
          TreeNodeContextMenu: true,
          Teleport: true
        }
      }
    });

    expect(wrapper.text()).toContain('name');
    expect(wrapper.text()).toContain('"John"');
  });

  it('renders expansion arrow only for expandable nodes', () => {
    const simpleWrapper = mount(TreeNode, {
      props: { node: mockNode, path: 'root.name', depth: 1 },
      global: { stubs: { TreeNodeContextMenu: true, Teleport: true } }
    });
    expect(simpleWrapper.find('.i-carbon-chevron-right').exists()).toBe(false);

    const complexNode: TTreeNode = {
      type: 'object',
      key: 'user',
      value: null,
      children: [{ type: 'string', key: 'id', value: '1' }]
    };
    const complexWrapper = mount(TreeNode, {
      props: { node: complexNode, path: 'root.user', depth: 1 },
      global: { stubs: { TreeNodeContextMenu: true, Teleport: true } }
    });
    expect(complexWrapper.find('.i-carbon-chevron-right').exists()).toBe(true);
  });
});
