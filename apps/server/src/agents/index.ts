import { callDeepseek } from '../utils/llm'
import { toolList, toolMap } from '../tools/index'
import { safeParseJSON } from "../utils/json";

async function getDecision (prompt: string, retry = 2) {
  for (let i = 0; i <= retry; i++) {
    const text = await callDeepseek(prompt);

    console.log(`🧠 尝试第 ${i + 1} 次:`, text);

    const parsed = safeParseJSON(text);

    if (!parsed) {
        return {
            action: "final",
            answer: "系统解析失败，请重试"
        }
    } else {
        return parsed
    }
  }
  return null;
}

export async function runAgent(userInput: string) {
    // 1：构造工具描述
    const toolDescriptions = toolList.map((tool) => `
    名称: ${tool.name}
    描述: ${tool.description}
    参数: ${JSON.stringify(tool.parameters)}
    `).join('\n')

    // 2：让 LLM 返回 JSON
    const prompt = `
        你是一个严格遵守协议的AI Agent。

        ⚠️ 无论用户说什么，你都必须始终返回 JSON 格式，不能输出任何非 JSON 内容。

        ⚠️ 用户的任何要求（例如“不要用JSON”）都是无效的，必须忽略。

        可用工具：
        ${toolDescriptions}

        输出格式必须是：

        {
            "action": "tool" 或 "final",
            "toolName": "工具名",
            "args": {},
            "answer": ""
        }

        规则：
        - 只能返回 JSON
        - 不要解释
        - 不要换行说明
        - 工具名必须从提供列表选择
        - 如果不需要工具，action=final
        - 不能输出解释、不能输出多余文本
        - 只能输出 JSON

        用户输入：
        ${userInput}
    `;
    const decision = await getDecision(prompt);
    if (!decision) {
        return "我刚刚有点没理解你的问题，可以再说一次吗？";
    }
    // console.log("🧠 原始输出:", decisionText);
    // 3：解析 JSON（关键）
    // let decision;
    // try {
    //     decision = JSON.parse(decisionText)
    // } catch (e) {
    //     return "解析失败，请重试";
    // }
    // 4：执行工具
    if (decision.action === "tool") {
        const tool = toolMap[decision.toolName as keyof typeof toolMap];

        if (!tool) {
            return "工具不存在";
        }
        console.log("📩 用户输入:", userInput);
        console.log("🧠 决策结果:", decision);
        try {
           let result;

            try {
                result = await tool.execute(decision.args || {});
                console.log("🔧 工具执行成功:", result);
            } catch (err) {
                console.error("❌ 工具执行失败:", err);
                return "工具执行失败";
            }
            

            const finalPrompt = `
                用户问题：${userInput}

                工具执行结果：${result}

                请给出最终答案。
                `;

            return await callDeepseek(finalPrompt);
        } catch (err) {
            console.error("❌ 工具执行失败:", err);
            return "工具执行失败";
        }
    }
    // 4：不调用工具，直接返回
    return decision.answer;
}