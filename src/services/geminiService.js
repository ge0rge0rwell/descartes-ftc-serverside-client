import { searchManual } from './searchService';

const OPENROUTER_API_KEY = "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";
const OPENROUTER_MODEL = "mistralai/mistral-7b-instruct:free";

export const callGemini = async (messages) => {
    const lastUserMessage = messages[messages.length - 1].content;
    const searchResults = await searchManual(lastUserMessage);

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
                "messages": augmentedMessages,
                "temperature": 0.5, // Slightly lower temperature for more precise rule-following
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

        // Final Defense: If there's an unmatched close tag or a lingering open tag, 
        // strip everything up to the last appearance of any reasoning artifact.
        const markers = ["</think>", "</thought>", "</reasoning>", "</analysis>", "--- END OF SEARCH ---"];
        markers.forEach(marker => {
            if (cleanedContent.includes(marker)) {
                cleanedContent = cleanedContent.substring(cleanedContent.lastIndexOf(marker) + marker.length);
            }
        });

        do {
            previousLength = cleanedContent.length;
            cleanedContent = cleanedContent
                .replace(/<(?:think|thought|reasoning|analysis|logic|thought_process|düşünme|muhakeme|internal)>[\s\S]*?(?:<\/(?:think|thought|reasoning|analysis|logic|thought_process|düşünme|muhakeme|internal)>|$)/gi, "")
                .replace(/^[\s\S]*?<\/think>/gi, "")
                .replace(/^[\s\S]*?<\/thought>/gi, "")
                .replace(/^[\s\S]*?<\/reasoning>/gi, "")
                .replace(/\[(?:thinking|thought|reasoning|analysis|internal)\][\s\S]*?(?:\[\/(?:thinking|thought|reasoning|analysis|internal)\]|$)/gi, "")
                .replace(/^(?:thought|thinking|reasoning|analysis|analiz|düşünme süreci|akıl yürütme|başlıyorum|muhakeme|planlama):?\s*.*$/gim, "")
                .replace(/^(?:düşünüyorum|thinking|analyzing|planlıyorum|hazırlıyorum)\.*$/gim, "")
                .replace(/Constructing response[\s\S]*?\.\.\./gi, "")
                .replace(/^(?:\*\*)?(?:thought|thinking|reasoning|analysis|analiz|düşünme süreci)(?:\*\*)?:?\s*.*$/gim, "")
                .replace(/^> [\s\S]*?$/gm, "");
        } while (cleanedContent.length !== previousLength);

        return cleanedContent.trim();
    } catch (error) {
        console.error("OpenRouter Gemini Error:", error);
        throw error; // Let the caller handle UI feedback
    }
};
