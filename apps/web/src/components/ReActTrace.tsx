import { useMemo, useState, type ReactNode } from "react";
import type { ReActTraceStep } from "../types/agent-events";

type ReActTraceProps = {
  steps: ReActTraceStep[];
  planSteps?: string[];
  isStreaming?: boolean;
};

function formatJson(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getActiveStepNumber(steps: ReActTraceStep[]): number | null {
  const inProgress = steps.find((item) => item.phase !== "done");
  if (inProgress) return inProgress.step;
  if (steps.length === 0) return null;
  return steps[steps.length - 1]?.step ?? null;
}

export default function ReActTrace({
  steps,
  planSteps,
  isStreaming = false,
}: ReActTraceProps) {
  const activeStep = useMemo(() => getActiveStepNumber(steps), [steps]);
  const [traceCollapsed, setTraceCollapsed] = useState(false);
  const [userExpanded, setUserExpanded] = useState<Set<number>>(() => new Set());
  const [userCollapsed, setUserCollapsed] = useState<Set<number>>(() => new Set());

  const autoCollapsedSteps = useMemo(
    () =>
      new Set(
        steps
          .filter(
            (item) => item.phase === "done" && item.step !== activeStep
          )
          .map((item) => item.step)
      ),
    [steps, activeStep]
  );

  const toggleStep = (stepNumber: number) => {
    const collapsed = isStepCollapsed(stepNumber);
    if (collapsed) {
      setUserExpanded((prev) => new Set(prev).add(stepNumber));
      setUserCollapsed((prev) => {
        const next = new Set(prev);
        next.delete(stepNumber);
        return next;
      });
    } else {
      setUserCollapsed((prev) => new Set(prev).add(stepNumber));
      setUserExpanded((prev) => {
        const next = new Set(prev);
        next.delete(stepNumber);
        return next;
      });
    }
  };

  const isStepCollapsed = (stepNumber: number) => {
    if (userExpanded.has(stepNumber)) return false;
    if (userCollapsed.has(stepNumber)) return true;
    if (stepNumber === activeStep && isStreaming) return false;
    return autoCollapsedSteps.has(stepNumber);
  };

  const collapseAll = () => {
    setUserCollapsed(new Set(steps.map((item) => item.step)));
    setUserExpanded(new Set());
  };

  const expandAll = () => {
    setUserCollapsed(new Set());
    setUserExpanded(new Set(steps.map((item) => item.step)));
  };

  if (planSteps && planSteps.length > 0) {
    return (
      <TraceShell
        title="任务拆解"
        traceCollapsed={traceCollapsed}
        onToggleTrace={() => setTraceCollapsed((value) => !value)}
        onCollapseAll={collapseAll}
        onExpandAll={expandAll}
        hasSteps={steps.length > 0}
      >
        {!traceCollapsed && (
          <>
            <ol className="react-trace__plan">
              {planSteps.map((step, index) => (
                <li key={`plan-${index}`}>{step}</li>
              ))}
            </ol>
            {steps.map((item) => (
              <TaskStepCard
                key={`task-${item.step}`}
                item={item}
                collapsed={isStepCollapsed(item.step)}
                onToggle={() => toggleStep(item.step)}
              />
            ))}
          </>
        )}
      </TraceShell>
    );
  }

  if (steps.length === 0) return null;

  return (
    <TraceShell
      title="ReAct 执行过程"
      traceCollapsed={traceCollapsed}
      onToggleTrace={() => setTraceCollapsed((value) => !value)}
      onCollapseAll={collapseAll}
      onExpandAll={expandAll}
      hasSteps={steps.length > 0}
    >
      {!traceCollapsed &&
        steps.map((item) => (
          <ReActStepCard
            key={item.step}
            item={item}
            collapsed={isStepCollapsed(item.step)}
            isActive={item.step === activeStep && isStreaming}
            onToggle={() => toggleStep(item.step)}
          />
        ))}
    </TraceShell>
  );
}

function TraceShell({
  title,
  traceCollapsed,
  onToggleTrace,
  onCollapseAll,
  onExpandAll,
  hasSteps,
  children,
}: {
  title: string;
  traceCollapsed: boolean;
  onToggleTrace: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  hasSteps: boolean;
  children: ReactNode;
}) {
  return (
    <div className="react-trace">
      <div className="react-trace__toolbar">
        <button
          type="button"
          className="react-trace__toggle"
          onClick={onToggleTrace}
          aria-expanded={!traceCollapsed}
        >
          <span className="react-trace__chevron" aria-hidden>
            {traceCollapsed ? "▶" : "▼"}
          </span>
          {title}
        </button>
        {hasSteps && !traceCollapsed && (
          <div className="react-trace__bulk">
            <button
              type="button"
              className="react-trace__bulk-btn"
              onClick={onExpandAll}
            >
              全部展开
            </button>
            <button
              type="button"
              className="react-trace__bulk-btn"
              onClick={onCollapseAll}
            >
              全部折叠
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function StepHeader({
  label,
  collapsed,
  onToggle,
  isActive,
}: {
  label: string;
  collapsed: boolean;
  onToggle: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      type="button"
      className="react-step__toggle"
      onClick={onToggle}
      aria-expanded={!collapsed}
    >
      <span className="react-trace__chevron" aria-hidden>
        {collapsed ? "▶" : "▼"}
      </span>
      <span className="react-step__title">{label}</span>
      {isActive && <span className="react-step__badge">进行中</span>}
    </button>
  );
}

function ReActStepCard({
  item,
  collapsed,
  isActive,
  onToggle,
}: {
  item: ReActTraceStep;
  collapsed: boolean;
  isActive?: boolean;
  onToggle: () => void;
}) {
  const summary = item.toolName
    ? `${item.toolName}(…)`
    : item.thought
      ? item.thought.slice(0, 48)
      : undefined;

  return (
    <div className={`react-step react-step--${item.phase}`}>
      <StepHeader
        label={`第 ${item.step} 轮${summary ? ` · ${summary}` : ""}`}
        collapsed={collapsed}
        onToggle={onToggle}
        isActive={isActive}
      />

      {!collapsed && (
        <div className="react-step__body">
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
      )}
    </div>
  );
}

function TaskStepCard({
  item,
  collapsed,
  onToggle,
}: {
  item: ReActTraceStep;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const title = `步骤 ${item.step}${item.thought ? `：${item.thought}` : ""}`;

  return (
    <div className={`react-step react-step--${item.phase}`}>
      <StepHeader label={title} collapsed={collapsed} onToggle={onToggle} />
      {!collapsed && item.observation !== undefined && (
        <div className="react-step__body">
          <div className="react-phase react-phase--observe">
            <span className="react-phase__label">结果</span>
            <pre className="react-phase__code">
              {formatJson(item.observation)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
