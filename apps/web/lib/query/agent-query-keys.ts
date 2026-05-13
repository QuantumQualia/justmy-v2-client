export const agentQueryKeys = {
  all: ["profile-agents"] as const,
  agents: () => [...agentQueryKeys.all, "agents"] as const,
  /** Prefix: invalidates all knowledge queries */
  knowledge: () => [...agentQueryKeys.all, "knowledge"] as const,
  knowledgeShared: (page: number, limit: number) =>
    [...agentQueryKeys.all, "knowledge", "shared", page, limit] as const,
  knowledgeAgent: (agentId: string, page: number, limit: number) =>
    [...agentQueryKeys.all, "knowledge", "agent", agentId, page, limit] as const,
} as const;
