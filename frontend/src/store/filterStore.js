import { create } from 'zustand';

const defaultFilters = {
    start_date: '',
    end_date: '',
    compare_previous_period: false,
    channel: '',
    platform: '',
    campaign_name: '',
    product_name: '',
    city: '',
    device: '',
    country: '',
    min_revenue: '',
    max_revenue: '',
    min_roas: '',
    min_orders: ''
};

/** URL'den başlangıç filtrelerini oku */
function readFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    const filters = { ...defaultFilters };
    Object.keys(defaultFilters).forEach((key) => {
        const val = params.get(key);
        if (val === null) return;

        if (key === 'compare_previous_period') {
            filters[key] = val === 'true';
            return;
        }

        filters[key] = val;
    });
    return filters;
}

/** Zustand state'iyle URL parametrelerini senkronize et */
function syncToURL(filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) return;
        if (key === 'compare_previous_period' && value !== true) return;
        params.set(key, String(value));
    });
    const newSearch = params.toString();
    const newURL = newSearch
        ? `${window.location.pathname}?${newSearch}`
        : window.location.pathname;
    window.history.replaceState(null, '', newURL);
}

const useFilterStore = create((set) => ({
    filters: readFiltersFromURL(),

    setFilter: (key, value) =>
        set((state) => {
            const filters = { ...state.filters, [key]: value };
            syncToURL(filters);
            return { filters };
        }),

    setFilters: (newFilters) =>
        set((state) => {
            const filters = { ...state.filters, ...newFilters };
            syncToURL(filters);
            return { filters };
        }),

    resetFilters: () =>
        set(() => {
            syncToURL(defaultFilters);
            return { filters: { ...defaultFilters } };
        })
}));

export default useFilterStore;
