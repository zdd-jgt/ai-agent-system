import { runAgent } from "./index";
import { planTask } from "./planner";
import type { AgentEventHandler } from "../types/agent-events";
import type { RunAgentOptions } from "./react";
import {
  addAssistantTurn,
  addUserTurn,
  formatMemoryContext,
  getTurnCount,
} from "../memory/session-memory";

export async function runTask(
  userInput: string,
  onEvent?: AgentEventHandler,
  options?: RunAgentOptions
) {
  console.log("🧠 开始任务:", userInput);

  const sessionId = options?.sessionId;
  const memoryContext = sessionId ? formatMemoryContext(sessionId) : "";

  if (sessionId) {
    onEvent?.({
      type: "memory",
      sessionId,
      turnCount: getTurnCount(sessionId),
    });
  }

  const steps = await planTask(userInput, memoryContext);
  console.log("📋 拆解步骤:", steps);
  onEvent?.({ type: "plan", steps });

  let finalResult = "";

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`🚀 执行步骤 ${i + 1}:`, step);
    onEvent?.({
      type: "task_step",
      step: i + 1,
      content: typeof step === "string" ? step : String(step),
    });

    const result = await runAgent(step);
    console.log(`✅ 步骤结果:`, result);
    finalResult += `\n步骤${i + 1}结果：${result}`;
    onEvent?.({
      type: "observe",
      step: i + 1,
      observation: result,
    });
  }

  const trimmed = finalResult.trim();
  if (sessionId) {
    addUserTurn(sessionId, userInput);
    addAssistantTurn(sessionId, trimmed);
    onEvent?.({
      type: "memory",
      sessionId,
      turnCount: getTurnCount(sessionId),
    });
  }

  onEvent?.({ type: "final", content: trimmed });
  return trimmed;
}
