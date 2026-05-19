export type AgentEventType =
  | "step_start"
  | "thought"
  | "action"
  | "observe"
  | "plan"
  | "task_step"
  | "memory"
  | "final"
  | "error";

export type AgentEvent = {
  type: AgentEventType;
  step?: number;
  content?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  observation?: unknown;
  steps?: string[];
  sessionId?: string;
  turnCount?: number;
};

export type AgentEventHandler = (event: AgentEvent) => void;
