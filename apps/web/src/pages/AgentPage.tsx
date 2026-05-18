import { useCallback, useEffect, useRef, useState } from "react";
import MarkdownContent from "../components/MarkdownContent";
import ReActTrace from "../components/ReActTrace";
import { runAgentStream } from "../services/agent";
import type { AgentStreamEvent, ReActTraceStep } from "../types/agent-events";
import "./AgentPage.css";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  trace: ReActTraceStep[];
  planSteps?: string[];
  status: "streaming" | "done" | "error";
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getOrCreateStep(
  trace: ReActTraceStep[],
  stepNumber: number
): ReActTraceStep {
  const existing = trace.find((item) => item.step === stepNumber);
  if (existing) return existing;

  const created: ReActTraceStep = {
    step: stepNumber,
    phase: "thinking",
  };
  trace.push(created);
  return created;
}

function applyStreamEvent(
  trace: ReActTraceStep[],
  planSteps: string[] | undefined,
  event: AgentStreamEvent
): { trace: ReActTraceStep[]; planSteps?: string[] } {
  const nextTrace = [...trace];
  let nextPlan = planSteps;

  switch (event.type) {
    case "plan":
      nextPlan = event.steps ?? [];
      break;
    case "step_start": {
      const stepNumber = event.step ?? nextTrace.length + 1;
      getOrCreateStep(nextTrace, stepNumber).phase = "thinking";
      break;
    }
    case "thought": {
      const item = getOrCreateStep(nextTrace, event.step ?? nextTrace.length);
      item.thought = event.content;
      item.phase = "thinking";
      break;
    }
    case "action": {
      const item = getOrCreateStep(nextTrace, event.step ?? nextTrace.length);
      item.toolName = event.toolName;
      item.args = event.args;
      item.phase = "acting";
      break;
    }
    case "observe": {
      const item = getOrCreateStep(nextTrace, event.step ?? nextTrace.length);
      item.observation = event.observation;
      item.phase = "done";
      break;
    }
    case "task_step": {
      const item = getOrCreateStep(nextTrace, event.step ?? nextTrace.length);
      item.thought = event.content;
      item.phase = "thinking";
      break;
    }
    default:
      break;
  }

  return { trace: nextTrace, planSteps: nextPlan };
}

export default function AgentPage() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("react");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleRun = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: text,
      trace: [],
      status: "done",
    };

    const assistantId = createId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      trace: [],
      status: "streaming",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await runAgentStream(text, mode, (event) => {
        setMessages((prev) =>
          prev.map((message) => {
            if (message.id !== assistantId) return message;

            const updated = applyStreamEvent(
              message.trace,
              message.planSteps,
              event
            );

            return {
              ...message,
              trace: updated.trace,
              planSteps: updated.planSteps,
              content:
                event.type === "final"
                  ? (event.content ?? message.content)
                  : message.content,
              status:
                event.type === "error"
                  ? "error"
                  : event.type === "final"
                    ? "done"
                    : "streaming",
            };
          })
        );
      });

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: result || message.content || "（无返回内容）",
                status: message.status === "error" ? "error" : "done",
              }
            : message
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: "执行失败，请确认后端已启动（localhost:3001）",
                status: "error",
              }
            : message
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleRun();
    }
  };

  return (
    <div className="agent-page">
      <header className="agent-page__header">
        <h1>AI Agent 控制台</h1>
        <p className="agent-page__subtitle">
          支持 Markdown 渲染与 ReAct 思考-行动-观察实时展示
        </p>
      </header>

      <section className="agent-chat" aria-label="对话区域">
        {messages.length === 0 && (
          <div className="agent-chat__empty">
            输入任务开始对话，例如：帮我计算 12*(8+5)，并告诉我今天星期几
          </div>
        )}

        {messages.map((message) => (
          <article
            key={message.id}
            className={`agent-message agent-message--${message.role}`}
          >
            <div className="agent-message__role">
              {message.role === "user" ? "你" : "Agent"}
            </div>

            {message.role === "assistant" && (
              <ReActTrace steps={message.trace} planSteps={message.planSteps} />
            )}

            {(message.content || message.status === "streaming") && (
              <div className="agent-message__bubble">
                {message.status === "streaming" && !message.content ? (
                  <span className="agent-message__typing">正在生成回答…</span>
                ) : (
                  <MarkdownContent content={message.content} />
                )}
              </div>
            )}
          </article>
        ))}
        <div ref={chatEndRef} />
      </section>

      <footer className="agent-composer">
        <textarea
          className="agent-composer__input"
          rows={3}
          placeholder="请输入你的任务…（Enter 发送，Shift+Enter 换行）"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <div className="agent-composer__actions">
          <select
            className="agent-composer__mode"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            disabled={loading}
          >
            <option value="react">ReAct Agent</option>
            <option value="task">Task Agent</option>
          </select>

          <button
            type="button"
            className="agent-composer__submit"
            onClick={() => void handleRun()}
            disabled={loading || !input.trim()}
          >
            {loading ? "执行中…" : "发送"}
          </button>
        </div>
      </footer>
    </div>
  );
}
