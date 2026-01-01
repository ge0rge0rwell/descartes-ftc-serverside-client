import { CreateMLCEngine } from "@mlc-ai/web-llm";

// Switching from 3B to 1B to prevent browser crashes on memory-constrained devices
const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

let engine = null;

export const initWebLLM = async (onProgress) => {
    if (engine) return engine;

    engine = await CreateMLCEngine(
        MODEL_ID,
        { initProgressCallback: onProgress }
    );
    return engine;
};

export const chatWithWebLLM = async (messages) => {
    if (!engine) throw new Error("WebLLM Engine not initialized");

    const reply = await engine.chat.completions.create({
        messages,
    });

    return reply.choices[0].message.content;
};
