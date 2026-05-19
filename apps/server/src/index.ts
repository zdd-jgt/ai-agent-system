import "dotenv/config";
import express from "express";
import cors from "cors";
import { runTask } from "./agents/executor";
import { runReAct } from "./agents/react";
import type { AgentEvent } from "./types/agent-events";

const app = express();
app.use(cors());
app.use(express.json());

function writeSseEvent(res: express.Response, event: AgentEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

app.post("/agent", async (req, res) => {
  const { message, sessionId } = req.body as {
    message?: string;
    sessionId?: string;
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  try {
    const mode = req.body.mode || "react";
    const options =
      typeof sessionId === "string" && sessionId.length > 0
        ? { sessionId }
        : undefined;
    let result;
    if (mode === "react") {
      result = await runReAct(message, undefined, options);
    } else {
      result = await runTask(message, undefined, options);
    }
    res.json({ result });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "LLM error" });
  }
});

app.post("/agent/stream", async (req, res) => {
  const { message, mode = "react", sessionId } = req.body as {
    message?: string;
    mode?: string;
    sessionId?: string;
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event: AgentEvent) => writeSseEvent(res, event);
  const options =
    typeof sessionId === "string" && sessionId.length > 0
      ? { sessionId }
      : undefined;

  try {
    if (mode === "react") {
      await runReAct(message, send, options);
    } else {
      await runTask(message, send, options);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.log(err);
    send({ type: "error", content: "LLM error" });
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

app.listen(3001, () => {
  console.log("server running on http://localhost:3001");
});
