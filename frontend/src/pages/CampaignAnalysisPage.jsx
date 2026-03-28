import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';

export default function CampaignAnalysisPage() {
    const { filters } = useFilterStore();
    const queryString = new URLSearchParams(filters).toString();

    const { data, isLoading } = useQuery({
        queryKey: ['campaign-performance', queryString],
        queryFn: async () => (await api.get(`/dashboard/campaign-performance?${queryString}`)).data.data || []
    });

    const columns = [
        { key: 'campaign_name', label: 'Kampanya', sortable: true },
        { key: 'platform', label: 'Platform', sortable: true },
        { key: 'spend', label: 'Harcama (TL)', sortable: true, formatter: (v) => `TL${v.toLocaleString('tr-TR')}` },
        { key: 'clicks', label: 'Tiklama', sortable: true, formatter: (v) => v.toLocaleString('tr-TR') },
        { key: 'conversions', label: 'Donusum', sortable: true, formatter: (v) => v.toLocaleString('tr-TR') },
        { key: 'revenue', label: 'Gelir (TL)', sortable: true, formatter: (v) => `TL${v.toLocaleString('tr-TR')}` },
        { key: 'roas', label: 'ROAS', sortable: true, formatter: (v) => `${v.toFixed(2)}x` }
    ];

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Kampanya Analizi</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Kampanya bazli harcama, donusum ve ROAS degerlerini inceleyin.</p>
            <FilterPanel />
            {isLoading ? <div style={{ padding: '24px' }}>Yukleniyor...</div> : null}
            <DataTable title="Kampanya Performansi" columns={columns} data={data || []} exportFileName="campaign_performance.csv" rowsPerPage={10} />
        </div>
    );
}
