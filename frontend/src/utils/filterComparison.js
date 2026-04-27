function toDate(value) {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toYmd(date) {
    return date.toISOString().slice(0, 10);
}

function round(value, digits = 1) {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

export function getComparisonRange(filters) {
    const start = toDate(filters?.start_date);
    const end = toDate(filters?.end_date);
    if (!start || !end || end < start) return null;

    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const dayCount = Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;

    const comparisonEnd = new Date(start);
    comparisonEnd.setDate(comparisonEnd.getDate() - 1);

    const comparisonStart = new Date(comparisonEnd);
    comparisonStart.setDate(comparisonStart.getDate() - (dayCount - 1));

    return {
        dayCount,
        start_date: toYmd(comparisonStart),
        end_date: toYmd(comparisonEnd)
    };
}

export function buildApiFilters(filters = {}) {
    return Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => {
            if (key === 'compare_previous_period') return false;
            return value !== '' && value !== null && value !== undefined;
        })
    );
}

export function buildQueryString(filters = {}) {
    return new URLSearchParams(buildApiFilters(filters)).toString();
}

export function buildComparisonFilters(filters = {}) {
    if (!filters.compare_previous_period) return null;
    const comparisonRange = getComparisonRange(filters);
    if (!comparisonRange) return null;

    return {
        ...filters,
        start_date: comparisonRange.start_date,
        end_date: comparisonRange.end_date,
        compare_previous_period: false
    };
}

export function calculateChange(currentValue, previousValue) {
    const current = Number(currentValue || 0);
    const previous = Number(previousValue || 0);
    if (previous === 0) {
        return current === 0 ? 0 : null;
    }
    return round(((current - previous) / Math.abs(previous)) * 100, 1);
}

export function getActiveFilterCount(filters = {}) {
    return Object.entries(filters).filter(([key, value]) => {
        if (key === 'compare_previous_period') return Boolean(value);
        return value !== '' && value !== null && value !== undefined;
    }).length;
}

export function getComparisonLabel(filters = {}) {
    const range = getComparisonRange(filters);
    if (!range) return '';
    return `${range.start_date} - ${range.end_date}`;
}
