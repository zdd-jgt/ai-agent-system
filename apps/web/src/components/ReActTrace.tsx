import type { ReActTraceStep } from "../types/agent-events";

type ReActTraceProps = {
  steps: ReActTraceStep[];
  planSteps?: string[];
};

function formatJson(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function ReActTrace({ steps, planSteps }: ReActTraceProps) {
  if (planSteps && planSteps.length > 0) {
    return (
      <div className="react-trace">
        <div className="react-trace__header">任务拆解</div>
        <ol className="react-trace__plan">
          {planSteps.map((step, index) => (
            <li key={`plan-${index}`}>{step}</li>
          ))}
        </ol>
        {steps.map((item) => (
          <TaskStepCard key={`task-${item.step}`} item={item} />
        ))}
      </div>
    );
  }

  if (steps.length === 0) return null;

  return (
    <div className="react-trace">
      <div className="react-trace__header">ReAct 执行过程</div>
      {steps.map((item) => (
        <ReActStepCard key={item.step} item={item} />
      ))}
    </div>
  );
}

function ReActStepCard({ item }: { item: ReActTraceStep }) {
  return (
    <div className={`react-step react-step--${item.phase}`}>
      <div className="react-step__title">第 {item.step} 轮</div>

      <div className="react-phase react-phase--think">
        <span className="react-phase__label">思考</span>
        <p className="react-phase__body">
          {item.thought ?? (item.phase === "thinking" ? "正在思考…" : "—")}
        </p>
      </div>

      {(item.toolName ||
        item.phase === "acting" ||
        item.phase === "observing" ||
        item.phase === "done") && (
        <div className="react-phase react-phase--act">
          <span className="react-phase__label">行动</span>
          <pre className="react-phase__code">
            {item.toolName
              ? `${item.toolName}(${formatJson(item.args ?? {})})`
              : item.phase === "acting"
                ? "正在调用工具…"
                : "—"}
          </pre>
        </div>
      )}

      {(item.observation !== undefined ||
        item.phase === "observing" ||
        item.phase === "done") && (
        <div className="react-phase react-phase--observe">
          <span className="react-phase__label">观察</span>
          <pre className="react-phase__code">
            {item.observation !== undefined
              ? formatJson(item.observation)
              : item.phase === "observing"
                ? "等待工具返回…"
                : "—"}
          </pre>
        </div>
      )}
    </div>
  );
}

function TaskStepCard({ item }: { item: ReActTraceStep }) {
  return (
    <div className={`react-step react-step--${item.phase}`}>
      <div className="react-step__title">
        步骤 {item.step}
        {item.thought ? `：${item.thought}` : ""}
      </div>
      {item.observation !== undefined && (
        <div className="react-phase react-phase--observe">
          <span className="react-phase__label">结果</span>
          <pre className="react-phase__code">{formatJson(item.observation)}</pre>
        </div>
      )}
    </div>
  );
}
