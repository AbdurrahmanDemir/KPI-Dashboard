import { create } from 'zustand';

const today = new Date();
const lastMonth = new Date();
lastMonth.setDate(today.getDate() - 30);

const formatDate = (date) => date.toISOString().split('T')[0];

const useFilterStore = create((set) => ({
    filters: {
        start_date: formatDate(lastMonth),
        end_date: formatDate(today),
        channel: '',
        platform: '',
        campaign_name: '',
        city: ''
    },
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
            filters: {
                start_date: formatDate(lastMonth),
                end_date: formatDate(today),
                channel: '',
                platform: '',
                campaign_name: '',
                city: ''
            }
        })
}));

export default useFilterStore;
