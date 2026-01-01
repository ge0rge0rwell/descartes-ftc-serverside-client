import manualIndex from '../data/manual-index.json';

export const searchManual = (query, limit = 3) => {
    if (!query) return [];

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
