import { create } from 'zustand';

const defaultFilters = {
    start_date: '',
    end_date: '',
    channel: '',
    platform: '',
    campaign_name: '',
    product_name: '',
    city: '',
    device: '',
    country: ''
};

/** URL'den başlangıç filtrelerini oku */
function readFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    const filters = { ...defaultFilters };
    Object.keys(defaultFilters).forEach((key) => {
        const val = params.get(key);
        if (val !== null) filters[key] = val;
    });
    return filters;
}

/** Zustand state'iyle URL parametrelerini senkronize et */
function syncToURL(filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
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
