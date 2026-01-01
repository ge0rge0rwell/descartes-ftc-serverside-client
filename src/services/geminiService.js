const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = "tngtech/deepseek-r1t-chimera:free";

export const callGemini = async (messages) => {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": window.location.origin, // Required by OpenRouter
                "X-Title": "Descartes FTC", // Optional but recommended
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": OPENROUTER_MODEL,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 2048,
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenRouter Error ${response.status}: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0]) {
            throw new Error('Invalid OpenRouter response');
        }

        const rawContent = data.choices[0].message.content;
        // Strip thinking blocks (e.g., <think>...</think>, <thought>...</thought>, [thinking]...[/thinking])
        const cleanedContent = rawContent
            .replace(/<(think|thought)>[\s\S]*?<\/\1>/gi, '') // Case-insensitive, handles both <think> and <thought>
            .replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '') // Handles potential square bracket versions
            .trim();

        return cleanedContent;
    } catch (error) {
        console.error("OpenRouter Gemini Error:", error);
        throw error; // Let the caller handle UI feedback
    }
};
