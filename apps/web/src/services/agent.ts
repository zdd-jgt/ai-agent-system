import { getSessionId } from "../lib/session";
import type { AgentStreamEvent } from "../types/agent-events";

const API_BASE = "http://localhost:3001";

export type AgentRequestOptions = {
  sessionId?: string;
};

export async function runAgent(
  message: string,
  mode = "react",
  options?: AgentRequestOptions
) {
  const sessionId = options?.sessionId ?? getSessionId();
  const res = await fetch(`${API_BASE}/agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, mode, sessionId }),
  });

  return res.json() as Promise<{ result: string }>;
}

export async function runAgentStream(
  message: string,
  mode: string,
  onEvent: (event: AgentStreamEvent) => void,
  options?: AgentRequestOptions
): Promise<string> {
  const sessionId = options?.sessionId ?? getSessionId();
  const res = await fetch(`${API_BASE}/agent/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, mode, sessionId }),
  });

  if (!res.ok) {
    throw new Error(`请求失败: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("浏览器不支持流式响应");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk
        .split("\n")
        .find((entry) => entry.startsWith("data: "));
      if (!line) continue;

      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;

      const event = JSON.parse(payload) as AgentStreamEvent;
      if (event.type === "final" && event.content) {
        finalResult = event.content;
      }
      onEvent(event);
    }
  }

  return finalResult;
}
