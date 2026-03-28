import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import BarChart from '../components/charts/BarChart';

export default function ChannelAnalysisPage() {
    const { filters } = useFilterStore();
    const queryString = new URLSearchParams(filters).toString();

    const { data, isLoading } = useQuery({
        queryKey: ['channel-performance', queryString],
        queryFn: async () => (await api.get(`/dashboard/channel-performance?${queryString}`)).data.data || []
    });

    const columns = [
        { key: 'channel', label: 'Kanal', sortable: true },
        { key: 'revenue', label: 'Ciro (TL)', sortable: true, formatter: (v) => `TL${v.toLocaleString('tr-TR')}` }
    ];

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Kanal Analizi</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Kanal bazli ciro performansini karsilastirin.</p>
            <FilterPanel />
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                <BarChart data={data || []} isLoading={isLoading} />
            </div>
            <DataTable title="Kanal Bazli Performans" columns={columns} data={data || []} exportFileName="channel_performance.csv" rowsPerPage={8} />
        </div>
    );
}
