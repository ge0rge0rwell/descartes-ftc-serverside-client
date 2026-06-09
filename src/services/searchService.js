/**
 * Search the manual index dynamically to keep the initial bundle small.
 */
// Count non-overlapping occurrences of `needle` in `haystack` without the
// allocations of String.split (which builds a throwaway array per call).
const countOccurrences = (haystack, needle) => {
    let count = 0;
    let from = 0;
    let idx;
    while ((idx = haystack.indexOf(needle, from)) !== -1) {
        count += 1;
        from = idx + needle.length;
    }
    return count;
};

export const searchManual = async (query, limit = 3) => {
    if (!query) return [];

    // Dynamically import to keep the manual index out of the initial bundle.
    const { default: manualIndex } = await import('../data/manual-index.json');

    // Tokenize on whitespace, strip surrounding punctuation, drop short/empty
    // tokens, and de-duplicate so a repeated word can't inflate the score.
    const searchTerms = [
        ...new Set(
            query
                .toLowerCase()
                .split(/\s+/)
                .map((word) => word.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ''))
                .filter((word) => word.length > 2),
        ),
    ];
    if (searchTerms.length === 0) return [];

    // Score every page, but only keep matches (avoids spreading all ~180 page
    // objects and re-sorting non-matches each query).
    const scored = [];
    for (const page of manualIndex) {
        const lowerContent = page.content.toLowerCase();
        let score = 0;
        for (const term of searchTerms) {
            score += countOccurrences(lowerContent, term);
        }
        if (score > 0) scored.push({ page: page.page, content: page.content, score });
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
};
