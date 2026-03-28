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

const useFilterStore = create((set) => ({
    filters: { ...defaultFilters },
    setFilter: (key, value) => 
        set((state) => ({
            filters: { ...state.filters, [key]: value }
        })),
    setFilters: (newFilters) => 
        set((state) => ({
            filters: { ...state.filters, ...newFilters }
        })),
    resetFilters: () => 
        set({
            filters: { ...defaultFilters }
        })
}));

export default useFilterStore;
