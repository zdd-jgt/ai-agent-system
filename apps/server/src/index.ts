import "dotenv/config";
import express from "express";
// import { callDeepseek } from "./utils/llm"
// import { runAgent } from "./agents"
import { runTask } from "./agents/executor";
import { runReAct } from "./agents/react"

const app = express();
app.use(express.json());

app.post("/agent", async (req, res) => {
    const { message } = req.body;
    try {
        const mode = req.body.mode || "react";
        let result;
        if (mode === "react") {
            result = await runReAct(message);
        } else {
            result = await runTask(message);
        }
        res.json({ result });
    }
    catch (err) {
        console.log(err)
        res.status(500).json({error: "LLM error"})
    }
})

// app.post("/chat", async (req, res) => {
//     const { message } = req.body;
//     try {
//         const result = await callDeepseek(message);
//         res.json({ result });
//     }
//     catch (err) {
//         console.log(err);
//         res.status(500).json({ error: "LLM error" });
//     }
// })

// app.get("/", (req, res) => {
//   res.send("AI Agent Server is running 🚀");
// });

app.listen(3001, () => {
  console.log("server running on http://localhost:3001");
});