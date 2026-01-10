/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

const treeStoreMocks = {
  isExpanded: vi.fn((path) => path === 'root'),
  selectedPath: null,
  searchQuery: '',
  searchResults: [],
  currentSearchIndex: -1,
  setSelectedPath: vi.fn(),
  toggleNode: vi.fn(),
};

// Mocking useTreeStore
vi.mock('@/stores/treeStore', () => ({
  useTreeStore: vi.fn(() => treeStoreMocks),
  default: vi.fn(() => treeStoreMocks)
}));

describe('TreeNode.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
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

  it('renders correctly for empty objects', () => {
    const emptyNode: TTreeNode = {
      type: 'object',
      key: 'data',
      value: null,
      children: []
    };
    const wrapper = mount(TreeNode, {
      props: { node: emptyNode, path: 'root.data', depth: 1 },
      global: { stubs: { TreeNodeContextMenu: true, Teleport: true } }
    });
    expect(wrapper.find('.i-carbon-chevron-right').exists()).toBe(false);
    expect(wrapper.text()).toContain('{}');
  });

  it('toggles expansion on click', async () => {
    const complexNode: TTreeNode = {
      type: 'object',
      key: 'user',
      value: null,
      children: [{ type: 'string', key: 'id', value: '1' }]
    };
    const wrapper = mount(TreeNode, {
      props: { node: complexNode, path: 'root.user', depth: 1 },
      global: { stubs: { TreeNodeContextMenu: true, Teleport: true } }
    });

    const header = wrapper.find('.node-header');
    await header.trigger('click');

    expect(treeStoreMocks.toggleNode).toHaveBeenCalledWith('root.user');
    expect(treeStoreMocks.setSelectedPath).toHaveBeenCalledWith('root.user');
  });
});
