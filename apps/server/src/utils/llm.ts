import OpenAI from "openai";

// console.log(process.env.DEEPSEEK_API_KEY,process.env.DEEPSEEK_BASE_URL)

//  初始化 调用deepseek大模型
const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL
})

// 创建大模型 传入用户输入内容，获取大模型输出的内容
export async function callDeepseek (prompt: string): Promise<string>{
    const response = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
            {
                role: "user",
                content: prompt
            }
        ]
    })
    let data = response.choices[0]?.message.content || '';
    return data
}