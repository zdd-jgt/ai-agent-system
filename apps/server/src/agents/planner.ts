import { callDeepseek } from '../utils/llm'

// 任务拆解
export async function planTask(userInput: string) {
    const prompt = `
        你是一个任务规划 Agent。

        请把用户任务拆解成多个步骤。

        【要求】
        1. 必须返回 JSON
        2. 格式如下：

        {
        "steps": [
            "步骤1",
            "步骤2"
        ]
        }

        用户任务：
        ${userInput}
    `;
    function cleanJSON(text: string) {
        return text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
    }


    const res = await callDeepseek(prompt);
    const cleaned = cleanJSON(res);
    console.log('原始输出：',res)
    try {
        const json = JSON.parse(cleaned);
        return json.steps || [];
    } catch (e) {
        console.log("❌ Planner 解析失败:", res);
        return [userInput]; // 降级：不拆
    }
}