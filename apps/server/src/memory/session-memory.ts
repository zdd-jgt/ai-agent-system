export type MemoryTurn = {
  role: "user" | "assistant";
  content: string;
  toolSummary?: string;
  timestamp: number;
};

export type SessionMemory = {
  sessionId: string;
  turns: MemoryTurn[];
};

const MAX_TURNS = 12;
const MAX_CONTEXT_CHARS = 4000;

const sessions = new Map<string, SessionMemory>();

function getOrCreate(sessionId: string): SessionMemory {
  let memory = sessions.get(sessionId);
  if (!memory) {
    memory = { sessionId, turns: [] };
    sessions.set(sessionId, memory);
  }
  return memory;
}

export function addUserTurn(sessionId: string, content: string): void {
  const memory = getOrCreate(sessionId);
  memory.turns.push({
    role: "user",
    content: content.trim(),
    timestamp: Date.now(),
  });
  trimTurns(memory);
}

export function addAssistantTurn(
  sessionId: string,
  content: string,
  toolSummary?: string
): void {
  const memory = getOrCreate(sessionId);
  const turn: MemoryTurn = {
    role: "assistant",
    content: content.trim(),
    timestamp: Date.now(),
  };
  if (toolSummary) {
    turn.toolSummary = toolSummary;
  }
  memory.turns.push(turn);
  trimTurns(memory);
}

export function getTurnCount(sessionId: string): number {
  const memory = sessions.get(sessionId);
  if (!memory) return 0;
  return memory.turns.filter((turn) => turn.role === "user").length;
}

function trimTurns(memory: SessionMemory): void {
  if (memory.turns.length > MAX_TURNS) {
    memory.turns = memory.turns.slice(-MAX_TURNS);
  }
}

/** 将近期对话格式化为可注入 LLM 的上下文块 */
export function formatMemoryContext(sessionId: string): string {
  const memory = sessions.get(sessionId);
  if (!memory || memory.turns.length === 0) {
    return "";
  }

  const lines: string[] = [];
  let totalChars = 0;

  for (const turn of [...memory.turns].reverse()) {
    const prefix = turn.role === "user" ? "用户" : "助手";
    let line = `${prefix}: ${turn.content}`;
    if (turn.toolSummary) {
      line += `\n  [工具记录] ${turn.toolSummary}`;
    }

    if (totalChars + line.length > MAX_CONTEXT_CHARS) break;
    lines.unshift(line);
    totalChars += line.length;
  }

  if (lines.length === 0) return "";

  return `
【会话记忆 — 近期对话，供理解指代与延续任务】
${lines.join("\n")}
`;
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}
