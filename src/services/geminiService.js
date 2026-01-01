import { searchManual } from './searchService';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = "tngtech/deepseek-r1t-chimera:free";

export const callGemini = async (messages) => {
    const lastUserMessage = messages[messages.length - 1].content;
    const searchResults = searchManual(lastUserMessage);

    let contextHeader = "\n\n--- MANUAL SEARCH RESULTS ---\n";
    if (searchResults.length > 0) {
        searchResults.forEach(res => {
            contextHeader += `[SAYFA ${res.page}]:\n${res.content}\n\n`;
        });
    } else {
        contextHeader += "Aranan konu kural kitabında bulunamadı.\n";
    }
    contextHeader += "--- END OF SEARCH ---\n";

    // Inject results into system message or as a separate context message
    const augmentedMessages = [...messages];
    augmentedMessages[0].content += contextHeader;

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

        // TITANIUM SUPPRESSION: Recursive cleaning to ensure zero leakage
        let cleanedContent = rawContent;
        let previousLength;

        do {
            previousLength = cleanedContent.length;
            cleanedContent = cleanedContent
                .replace(/<(?:think|thought|reasoning|analysis|logic|thought_process|düşünme)>[\s\S]*?(?:<\/(?:think|thought|reasoning|analysis|logic|thought_process|düşünme)>|$)/gi, "")
                .replace(/^[\s\S]*?<\/think>/gi, "")
                .replace(/^[\s\S]*?<\/thought>/gi, "")
                .replace(/\[(?:thinking|thought|reasoning|analysis)\][\s\S]*?(?:\[\/(?:thinking|thought|reasoning|analysis)\]|$)/gi, "")
                .replace(/^(?:thought|thinking|reasoning|analysis|analiz|düşünme süreci|akıl yürütme|başlıyorum):?\s*.*$/gim, "")
                .replace(/^(?:düşünüyorum|thinking|analyzing|planlıyorum)\.*$/gim, "")
                .replace(/Constructing response[\s\S]*?\.\.\./gi, "")
                .replace(/^> [\s\S]*?$/gm, ""); // Strip any markdown blockquotes used for reasoning
        } while (cleanedContent.length !== previousLength);

        return cleanedContent.trim();
    } catch (error) {
        console.error("OpenRouter Gemini Error:", error);
        throw error; // Let the caller handle UI feedback
    }
};
