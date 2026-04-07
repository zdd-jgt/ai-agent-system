import { callDeepseek } from "../utils/llm";
import { toolMap, toolList } from "../tools";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function runReAct(userInput: string) {
    let messages: Message[] = [
        { role: "user", content: userInput }
    ];
    // 1：构造工具描述
    const toolDescriptions = toolList.map((tool) => `
    名称: ${tool.name}
    描述: ${tool.description}
    参数: ${JSON.stringify(tool.parameters)}
    `).join('\n')
  

    for (let step = 0; step < 5; step++) {
        console.log(`🧠 ReAct Step ${step + 1}`);

        const prompt = `
            你是一个智能 Agent，可以不断思考并调用工具解决问题。

            可用工具：
            ${toolDescriptions}

            你必须严格输出 JSON：

            {
                "thought": "你的思考",
                "action": "tool 或 final",
                "toolName": "工具名",
                "args": {},
                "answer": "最终答案"
            }

            【规则】
            - 如果需要工具：action=tool
            - 如果可以回答：action=final
            - 不要输出 markdown
            - 不要输出解释
            - 只能返回 JSON
            - 不要换行说明
            - 工具名必须从提供列表选择
            - 不能输出解释、不能输出多余文本
            - 只能输出 JSON

            历史对话：
            ${messages.map(m => `${m.role}: ${m.content}`).join("\n")}
        `;

        const res = await callDeepseek(prompt);

        const cleaned = res.replace(/```json|```/g, "").trim();

        let data: any;

        try {
            data = JSON.parse(cleaned);
        } catch (e) {
            console.log("❌ ReAct JSON 解析失败:", res);
            return "解析失败";
        }

        console.log("🧠 Thought:", data.thought);

        if (data.action === "final") {
            return data.answer;
        }

        if (data.action === "tool") {
            const tool = toolMap[data.toolName as keyof typeof toolMap];
            console.log("当前可用工具：", Object.keys(toolMap));
            console.log("LLM 请求工具：", data.toolName);
            if (!tool) {
                return `工具不存在: ${data.toolName}`;
            }

            const result = await tool.execute(data.args);

            console.log("🔧 工具结果:", result);

            messages.push({
                role: "assistant",
                content: `调用工具 ${data.toolName} 得到结果：${result}`
            });
        }
    }

  return "超过最大思考轮次";
}