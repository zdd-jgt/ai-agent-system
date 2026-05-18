import { runAgent } from "./index";
import { planTask } from "./planner";
import type { AgentEventHandler } from "../types/agent-events";

export async function runTask(
  userInput: string,
  onEvent?: AgentEventHandler
) {
  console.log("🧠 开始任务:", userInput);

  const steps = await planTask(userInput);
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

  onEvent?.({ type: "final", content: finalResult.trim() });
  return finalResult.trim();
}
