// 执行循环
import { runAgent } from "./index";
import { planTask } from "./planner";

export async function runTask(userInput: string) {
  console.log("🧠 开始任务:", userInput);

  const steps = await planTask(userInput);

  console.log("📋 拆解步骤:", steps);

  let finalResult = "";

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    console.log(`🚀 执行步骤 ${i + 1}:`, step);

    const result = await runAgent(step);

    console.log(`✅ 步骤结果:`, result);

    finalResult += `\n步骤${i + 1}结果：${result}`;
  }

  return finalResult;
}