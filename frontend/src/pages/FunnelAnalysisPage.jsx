import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import FunnelChart from '../components/charts/FunnelChart';
import KpiCard from '../components/ui/KpiCard';
import {
    buildComparisonFilters,
    buildQueryString,
    calculateChange,
    getComparisonLabel
} from '../utils/filterComparison';

export default function FunnelAnalysisPage() {
    const { filters } = useFilterStore();
    const queryString = buildQueryString(filters);
    const comparisonFilters = buildComparisonFilters(filters);
    const comparisonQueryString = comparisonFilters ? buildQueryString(comparisonFilters) : '';
    const comparisonLabel = filters.compare_previous_period
        ? `onceki donem (${getComparisonLabel(filters)})`
        : 'onceki donem';

    const { data, isLoading, error } = useQuery({
        queryKey: ['funnel-performance', queryString],
        queryFn: async () => (await api.get(`/dashboard/funnel?${queryString}`)).data.data || []
    });

    const { data: comparisonData = [] } = useQuery({
        enabled: Boolean(comparisonFilters),
        queryKey: ['funnel-performance-comparison', comparisonQueryString],
        queryFn: async () => (await api.get(`/dashboard/funnel?${comparisonQueryString}`)).data.data || []
    });

    const steps = data || [];
    const previousSteps = comparisonData || [];
    const firstStep = steps[0];
    const lastStep = steps[steps.length - 1];
    const previousFirstStep = previousSteps[0];
    const previousLastStep = previousSteps[previousSteps.length - 1];
    const overallCvr = firstStep && lastStep && firstStep.session_count > 0
        ? ((lastStep.session_count / firstStep.session_count) * 100).toFixed(1)
        : 0;
    const previousOverallCvr = previousFirstStep && previousLastStep && previousFirstStep.session_count > 0
        ? ((previousLastStep.session_count / previousFirstStep.session_count) * 100)
        : 0;
    const biggestDropoff = steps.reduce((max, step) =>
        (step.dropoff_rate || 0) > (max?.dropoff_rate || 0) ? step : max, null);
    const previousBiggestDropoff = previousSteps.reduce((max, step) =>
        (step.dropoff_rate || 0) > (max?.dropoff_rate || 0) ? step : max, null);
    const compareEnabled = Boolean(comparisonFilters);

    const columns = [
        { key: 'step_order', label: 'Adım No', sortable: true },
        { key: 'step_name', label: 'Adım Adı', sortable: true },
        { key: 'session_count', label: 'Oturum', sortable: true, formatter: (v) => v.toLocaleString('tr-TR') },
        { key: 'conversion_rate', label: 'Toplam CVR (%)', sortable: true, formatter: (v) => `%${Number(v).toFixed(1)}` },
        { key: 'dropoff_rate', label: 'Önceki Adımdan Kayıp (%)', sortable: true, formatter: (v) => `%${Number(v).toFixed(1)}` }
    ];

    if (error) {
        return (
            <div style={{ padding: '24px', color: 'var(--color-accent-danger)' }}>
                Funnel verisi yüklenirken hata oluştu: {error.message}
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Funnel Analizi</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Ziyaretten satın almaya kadar her adımdaki kullanıcı kaybını ve dönüşüm oranlarını inceleyin.
            </p>

            <FilterPanel />

            {/* Özet KPI Kartları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard
                    title="Giriş Oturumu"
                    value={firstStep?.session_count || 0}
                    change={compareEnabled ? calculateChange(firstStep?.session_count || 0, previousFirstStep?.session_count || 0) : undefined}
                    comparisonLabel={comparisonLabel}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="Satın Alma"
                    value={lastStep?.session_count || 0}
                    change={compareEnabled ? calculateChange(lastStep?.session_count || 0, previousLastStep?.session_count || 0) : undefined}
                    comparisonLabel={comparisonLabel}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="Toplam Dönüşüm"
                    value={Number(overallCvr)}
                    suffix="%"
                    change={compareEnabled ? calculateChange(Number(overallCvr), previousOverallCvr) : undefined}
                    comparisonLabel={comparisonLabel}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="En Büyük Kayıp Adımı"
                    value={biggestDropoff?.dropoff_rate || 0}
                    suffix="%"
                    change={compareEnabled ? calculateChange(biggestDropoff?.dropoff_rate || 0, previousBiggestDropoff?.dropoff_rate || 0) : undefined}
                    comparisonLabel={comparisonLabel}
                    isLoading={isLoading}
                    subtitle={biggestDropoff?.step_name || '—'}
                />
            </div>

            {/* Funnel Grafiği */}
            <div style={{ marginBottom: '24px' }}>
                <FunnelChart data={steps} isLoading={isLoading} />
            </div>

            {/* Detay Tablosu */}
            <DataTable
                title="Funnel Adım Detayları"
                columns={columns}
                data={steps}
                exportFileName="funnel_analizi.csv"
                rowsPerPage={10}
                isLoading={isLoading}
                enableGrouping
                groupByOptions={['step_name']}
            />
        </div>
    );
}
