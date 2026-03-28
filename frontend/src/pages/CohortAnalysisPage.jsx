import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';

export default function CohortAnalysisPage() {
    const { filters } = useFilterStore();
    const queryString = new URLSearchParams(filters).toString();

    const { data, isLoading } = useQuery({
        queryKey: ['cohort-performance', queryString],
        queryFn: async () => (await api.get(`/dashboard/cohort?${queryString}`)).data.data || []
    });

    const columns = [
        { key: 'cohort_month', label: 'Cohort Month', sortable: true },
        { key: 'month_offset', label: 'Month Offset', sortable: true },
        { key: 'customers', label: 'Customers', sortable: true, formatter: (v) => v.toLocaleString('tr-TR') },
        { key: 'orders', label: 'Orders', sortable: true, formatter: (v) => v.toLocaleString('tr-TR') },
        { key: 'retention_rate', label: 'Retention', sortable: true, formatter: (v) => `%${v.toFixed(2)}` }
    ];

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Cohort Analizi</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Ilk siparis ayi bazli musteri tekrar satin alma davranisini izleyin.</p>
            <FilterPanel />
            {isLoading ? <div style={{ padding: '24px' }}>Yukleniyor...</div> : null}
            <DataTable title="Cohort Retention Tablosu" columns={columns} data={data || []} exportFileName="cohort_analysis.csv" rowsPerPage={12} />
        </div>
    );
}
