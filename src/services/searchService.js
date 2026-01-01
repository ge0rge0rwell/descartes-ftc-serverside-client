/**
 * Search the manual index dynamically to keep the initial bundle small.
 */
export const searchManual = async (query, limit = 3) => {
    if (!query) return [];

    // Dynmically import to prevent large bundle size
    const { default: manualIndex } = await import('../data/manual-index.json');

    const searchTerms = query.toLowerCase().split(' ').filter(word => word.length > 2);

    // Sort pages by term frequency/matches
    const results = manualIndex.map(page => {
        let score = 0;
        const lowerContent = page.content.toLowerCase();

        searchTerms.forEach(term => {
            if (lowerContent.includes(term)) {
                score += (lowerContent.split(term).length - 1);
            }
        });

        return { ...page, score };
    })
        .filter(page => page.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return results;
};
