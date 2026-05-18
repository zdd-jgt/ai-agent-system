import { callDeepseek } from "../utils/llm";
import { toolMap, toolList } from "../tools";
import type { AgentEventHandler } from "../types/agent-events";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function runReAct(
  userInput: string,
  onEvent?: AgentEventHandler
) {
  const messages: Message[] = [{ role: "user", content: userInput }];
  let scratchpad = "";
  const usedTools = new Set<string>();

  const toolDescriptions = toolList
    .map(
      (tool) => `
    名称: ${tool.name}
    描述: ${tool.description}
    参数: ${JSON.stringify(tool.parameters)}
    `
    )
    .join("\n");

  const MAX_STEPS = 5;

  for (let step = 0; step < MAX_STEPS; step++) {
    console.log(`🧠 ReAct Step ${step + 1}`);
    onEvent?.({ type: "step_start", step: step + 1 });

    const prompt = `
            你是一个智能 Agent，可以通过思考调用工具解决问题。

            可用工具：
            ${toolDescriptions}

            【思考过程】
            ${scratchpad}

            【历史对话】
            ${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}   

            【输出格式（必须严格 JSON）】
            {
                "thought": "你的思考",
                "action": "tool 或 final",
                "toolName": "工具名",
                "args": {},
                "answer": "最终答案"
            }

            【强制规则】
            1. 如果信息足够，必须 action=final
            2. 不允许重复调用相同工具和参数
            3. 只能输出 JSON
            4. 不要解释
            5. 不要输出 markdown
            6. 如果需要工具：action=tool
            7. 如果可以回答：action=final
            8. 工具名必须从提供列表选择
            9. 不能输出解释、不能输出多余文本
        `;

    const res = await callDeepseek(prompt);
    const cleaned = res.replace(/```json|```/g, "").trim();

    let data: {
      thought?: string;
      action?: string;
      toolName?: string;
      args?: Record<string, unknown>;
      answer?: string;
    };

    try {
      data = JSON.parse(cleaned) as typeof data;
    } catch {
      console.log("❌ ReAct JSON 解析失败:", res);
      onEvent?.({ type: "error", content: "解析失败" });
      return "解析失败";
    }

    if (data.thought) {
      console.log("🧠 Thought:", data.thought);
      onEvent?.({ type: "thought", step: step + 1, content: data.thought });
    }

    if (data.action === "final") {
      console.log("✅ Final Answer:", data.answer);
      const answer = data.answer ?? "";
      onEvent?.({ type: "final", content: answer });
      return answer;
    }

    if (data.action === "tool") {
      const toolName = data.toolName;
      if (!toolName) {
        const msg = "未指定工具名";
        onEvent?.({ type: "error", content: msg });
        return msg;
      }

      const tool = toolMap[toolName as keyof typeof toolMap];
      console.log("当前可用工具：", Object.keys(toolMap));
      console.log("LLM 请求工具：", toolName);
      if (!tool) {
        const msg = `工具不存在: ${toolName}`;
        onEvent?.({ type: "error", content: msg });
        return msg;
      }

      const toolArgs = data.args ?? {};
      const toolKey = `${toolName}-${JSON.stringify(toolArgs)}`;
      if (usedTools.has(toolKey)) {
        const msg = "检测到重复调用工具，已终止";
        onEvent?.({ type: "error", content: msg });
        return msg;
      }
      usedTools.add(toolKey);

      onEvent?.({
        type: "action",
        step: step + 1,
        toolName,
        args: toolArgs,
      });

      const result = await tool.execute(toolArgs as never);
      console.log("🔧 工具结果:", result);

      onEvent?.({
        type: "observe",
        step: step + 1,
        observation: result,
      });

      scratchpad += `
                Thought: ${data.thought ?? ""}
                Action: ${data.toolName}
                Action Input: ${JSON.stringify(data.args ?? {})}
                Observation: ${JSON.stringify(result)}
            `;

      messages.push({
        role: "assistant",
        content: `调用工具 ${data.toolName} 得到结果：${JSON.stringify(result)}`,
      });
    }
  }

  console.log("⚠️ 超过最大思考轮次，开始总结");

  const finalPrompt = `
        基于以下信息，直接给出最终答案：

        ${scratchpad}

        用户问题：
        ${userInput}

        只输出答案，不要JSON
    `;

  const finalAnswer = await callDeepseek(finalPrompt);
  onEvent?.({ type: "final", content: finalAnswer });
  return finalAnswer;
}
