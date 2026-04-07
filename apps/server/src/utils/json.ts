export function safeParseJSON(text: string) {
  try {
    return JSON.parse(text)
  } catch (e) {
    console.log("❌ JSON解析失败，尝试修复:", text)

    // 尝试提取 JSON
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch (e2) {
        console.log("❌ 修复失败")
      }
    }

    return null
  }
}