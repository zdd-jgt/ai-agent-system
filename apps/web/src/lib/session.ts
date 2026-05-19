const SESSION_KEY = "ai-agent-session-id";

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getSessionId(): string {
  if (typeof sessionStorage === "undefined") {
    return createSessionId();
  }

  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = createSessionId();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function resetSessionId(): string {
  const id = createSessionId();
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function formatSessionLabel(sessionId: string): string {
  return sessionId.slice(0, 8);
}
