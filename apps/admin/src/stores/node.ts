import {
  filterNodeList,
  queryNodeTag,
} from "@workspace/ui/services/admin/server";
import { create } from "zustand";

interface NodeState {
  // Data
  nodes: API.Node[];
  tags: string[];

  // Loading states
  loading: boolean;
  loadingTags: boolean;
  loaded: boolean;
  loadedTags: boolean;

  // Actions
  fetchNodes: () => Promise<void>;
  fetchTags: () => Promise<void>;

  // Getters
  getNodeById: (nodeId: number) => API.Node | undefined;
  isInboundUsedInNodes: (serverId: number, inboundAlias: string) => boolean;
  isProtocolUsedInNodes: (serverId: number, protocolType: string) => boolean;
  isServerReferencedByNodes: (serverId: number) => boolean;
  getNodesByTag: (tag: string) => API.Node[];
  getNodesWithoutTags: () => API.Node[];
  getNodeTags: () => string[];
  getAllAvailableTags: () => string[];
}

export const useNodeStore = create<NodeState>((set, get) => ({
  // Initial state
  nodes: [],
  tags: [],
  loading: false,
  loadingTags: false,
  loaded: false,
  loadedTags: false,

  // Actions
  fetchNodes: async () => {
    if (get().loading) return;

    set({ loading: true });
    try {
      const { data } = await filterNodeList({ page: 1, size: 999_999_999 });
      set({
        nodes: data?.data?.list || [],
        loaded: true,
      });
    } catch (_error) {
      // Handle error silently
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  fetchTags: async () => {
    if (get().loadingTags) return;

    set({ loadingTags: true });
    try {
      const { data } = await queryNodeTag();
      set({
        tags: data?.data?.tags || [],
        loadedTags: true,
      });
    } catch (_error) {
      // Handle error silently
      set({ loadedTags: true });
    } finally {
      set({ loadingTags: false });
    }
  },

  // Getters
  getNodeById: (nodeId: number) => get().nodes.find((n) => n.id === nodeId),

  isInboundUsedInNodes: (serverId: number, inboundAlias: string) =>
    get().nodes.some(
      (node) =>
        node.server_id === serverId &&
        (node.inbound_alias || node.protocol) === inboundAlias
    ),

  isProtocolUsedInNodes: (serverId: number, protocolType: string) =>
    get().isInboundUsedInNodes(serverId, protocolType),

  isServerReferencedByNodes: (serverId: number) =>
    get().nodes.some((node) => node.server_id === serverId),

  getNodesByTag: (tag: string) =>
    get().nodes.filter((node) => (node.tags || []).includes(tag)),

  getNodesWithoutTags: () =>
    get().nodes.filter((node) => (node.tags || []).length === 0),

  getNodeTags: () =>
    Array.from(
      new Set(
        get()
          .nodes.flatMap((node) => (Array.isArray(node.tags) ? node.tags : []))
          .filter(Boolean)
      )
    ) as string[],

  getAllAvailableTags: () => {
    const nodeExtractedTags = get().getNodeTags();
    const allApiTags = get().tags;
    return Array.from(new Set([...allApiTags, ...nodeExtractedTags])).filter(
      Boolean
    );
  },
}));

export const useNode = () => {
  const store = useNodeStore();

  // Auto-fetch nodes and tags
  if (!(store.loaded || store.loading)) {
    store.fetchNodes();
  }
  if (!(store.loadedTags || store.loadingTags)) {
    store.fetchTags();
  }

  return {
    nodes: store.nodes,
    tags: store.tags,
    loading: store.loading,
    loadingTags: store.loadingTags,
    loaded: store.loaded,
    loadedTags: store.loadedTags,
    fetchNodes: store.fetchNodes,
    fetchTags: store.fetchTags,
    getNodeById: store.getNodeById,
    isInboundUsedInNodes: store.isInboundUsedInNodes,
    isProtocolUsedInNodes: store.isProtocolUsedInNodes,
    isServerReferencedByNodes: store.isServerReferencedByNodes,
    getNodesByTag: store.getNodesByTag,
    getNodesWithoutTags: store.getNodesWithoutTags,
    getNodeTags: store.getNodeTags,
    getAllAvailableTags: store.getAllAvailableTags,
  };
};

export default useNodeStore;
