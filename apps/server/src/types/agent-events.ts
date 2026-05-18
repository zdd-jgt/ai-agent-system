export type AgentEventType =
  | "step_start"
  | "thought"
  | "action"
  | "observe"
  | "plan"
  | "task_step"
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
};

export type AgentEventHandler = (event: AgentEvent) => void;
