export const formatSoldCount = (count = 0) => {
    const numeric = Number(count || 0);
    if (numeric <= 0) return '0';

    try {
        return new Intl.NumberFormat('en', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(numeric);
    } catch {
        return String(numeric);
    }
};
