import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import CohortHeatmap from '../components/charts/CohortHeatmap';
import KpiCard from '../components/ui/KpiCard';

export default function CohortAnalysisPage() {
    const { filters } = useFilterStore();
    const queryString = new URLSearchParams(filters).toString();

    const { data, isLoading, error } = useQuery({
        queryKey: ['cohort-performance', queryString],
        queryFn: async () => (await api.get(`/dashboard/cohort?${queryString}`)).data.data || []
    });

    const rows = data || [];

    // Month 0 cohort boyutları toplamı = toplam müşteri sayısı
    const totalCustomers = rows
        .filter(r => r.month_offset === 0)
        .reduce((sum, r) => sum + (r.customers || 0), 0);

    // Month 1 retention ortalaması
    const month1Rows = rows.filter(r => r.month_offset === 1);
    const avgMonth1Retention = month1Rows.length > 0
        ? (month1Rows.reduce((sum, r) => sum + (r.retention_rate || 0), 0) / month1Rows.length).toFixed(1)
        : 0;

    // En yüksek retention cohort'u
    const bestCohort = rows
        .filter(r => r.month_offset === 1)
        .sort((a, b) => b.retention_rate - a.retention_rate)[0];

    const columns = [
        { key: 'cohort_month', label: 'Cohort Ayı', sortable: true },
        { key: 'month_offset', label: 'Ay Farkı', sortable: true },
        { key: 'customers', label: 'Müşteri Sayısı', sortable: true, formatter: (v) => v.toLocaleString('tr-TR') },
        { key: 'orders', label: 'Sipariş', sortable: true, formatter: (v) => v.toLocaleString('tr-TR') },
        { key: 'retention_rate', label: 'Retention (%)', sortable: true, formatter: (v) => `%${Number(v).toFixed(1)}` }
    ];

    if (error) {
        return (
            <div style={{ padding: '24px', color: 'var(--color-accent-danger)' }}>
                Cohort verisi yüklenirken hata oluştu: {error.message}
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Cohort Analizi</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                İlk sipariş ayına göre müşteri grubunun sonraki aylardaki tekrar satın alma davranışını izleyin.
            </p>

            <FilterPanel />

            {/* Özet KPI Kartları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard
                    title="Toplam Müşteri (Cohort)"
                    value={totalCustomers}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="Ort. 1. Ay Retention"
                    value={Number(avgMonth1Retention)}
                    suffix="%"
                    isLoading={isLoading}
                />
                <KpiCard
                    title="En İyi Cohort Ayı"
                    value={bestCohort?.retention_rate || 0}
                    suffix="%"
                    isLoading={isLoading}
                    subtitle={bestCohort?.cohort_month || '—'}
                />
                <KpiCard
                    title="Cohort Sayısı"
                    value={[...new Set(rows.map(r => r.cohort_month))].length}
                    isLoading={isLoading}
                />
            </div>

            {/* Cohort Heatmap */}
            <div style={{ marginBottom: '24px' }}>
                <CohortHeatmap data={rows} isLoading={isLoading} />
            </div>

            {/* Detay Tablosu */}
            <DataTable
                title="Cohort Retention Detay Tablosu"
                columns={columns}
                data={rows}
                exportFileName="cohort_analizi.csv"
                rowsPerPage={12}
            />
        </div>
    );
}
