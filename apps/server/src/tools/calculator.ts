export const calculatorTool = {
    name: "calculator",
    description: "执行简单数学计算",
    parameters: {
        type: "object",
        properties: {
            expression: {
                type: "string",
                description: "数学表达式，例如 2+3*5",
            },
        },
        required: ["expression"],
    },
    execute: async ({ expression }: { expression: string }) => {
        try {
            // TODO 简化实现（后面可以换更安全的）
            return eval(expression).toString();
        } catch {
            return "计算错误";
        }
    },
}