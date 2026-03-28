import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';

export default function FunnelAnalysisPage() {
    const { filters } = useFilterStore();
    const queryString = new URLSearchParams(filters).toString();

    const { data, isLoading } = useQuery({
        queryKey: ['funnel-performance', queryString],
        queryFn: async () => (await api.get(`/dashboard/funnel?${queryString}`)).data.data || []
    });

    const columns = [
        { key: 'step_order', label: 'Adim', sortable: true },
        { key: 'step_name', label: 'Step', sortable: true },
        { key: 'session_count', label: 'Session Count', sortable: true, formatter: (v) => v.toLocaleString('tr-TR') },
        { key: 'conversion_rate', label: 'Conversion Rate', sortable: true, formatter: (v) => `%${v.toFixed(2)}` },
        { key: 'dropoff_rate', label: 'Dropoff Rate', sortable: true, formatter: (v) => `%${v.toFixed(2)}` }
    ];

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Funnel Analizi</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Adim bazli kayiplari ve toplam donusum oranlarini inceleyin.</p>
            <FilterPanel />
            {isLoading ? <div style={{ padding: '24px' }}>Yukleniyor...</div> : null}
            <DataTable title="Funnel Adimlari" columns={columns} data={data || []} exportFileName="funnel_analysis.csv" rowsPerPage={10} />
        </div>
    );
}
