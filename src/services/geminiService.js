const OPENROUTER_API_KEY = "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";
const OPENROUTER_MODEL = "google/gemini-2.0-flash-lite-preview-02-05:free";

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

        return data.choices[0].message.content;
    } catch (error) {
        console.error("OpenRouter Gemini Error:", error);
        throw error; // Let the caller handle UI feedback
    }
};
