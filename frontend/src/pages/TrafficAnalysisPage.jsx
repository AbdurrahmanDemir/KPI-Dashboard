import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import KpiCard from '../components/ui/KpiCard';
import DonutChart from '../components/charts/DonutChart';
import TrendChart from '../components/charts/TrendChart';
import {
    buildComparisonFilters,
    buildQueryString,
    calculateChange,
    getComparisonLabel
} from '../utils/filterComparison';

export default function TrafficAnalysisPage() {
    const { filters } = useFilterStore();
    const queryString = buildQueryString(filters);
    const comparisonFilters = buildComparisonFilters(filters);
    const comparisonQueryString = comparisonFilters ? buildQueryString(comparisonFilters) : '';
    const comparisonLabel = filters.compare_previous_period
        ? `onceki donem (${getComparisonLabel(filters)})`
        : 'onceki donem';

    const { data: summaryData, isLoading, error } = useQuery({
        queryKey: ['traffic-summary', queryString],
        queryFn: async () => (await api.get(`/kpi/summary?${queryString}`)).data.data
    });

    const { data: trendData, isLoading: isTrendLoading } = useQuery({
        queryKey: ['traffic-trend', queryString],
        queryFn: async () => (await api.get(`/kpi/trend?${queryString}`)).data.data || []
    });

    const { data: comparisonSummaryData } = useQuery({
        enabled: Boolean(comparisonFilters),
        queryKey: ['traffic-summary-comparison', comparisonQueryString],
        queryFn: async () => (await api.get(`/kpi/summary?${comparisonQueryString}`)).data.data
    });

    const traffic = summaryData?.traffic || {};
    const previousTraffic = comparisonSummaryData?.traffic || {};
    const donutData = summaryData?.breakdowns?.platform_distribution || [];
    const compareEnabled = Boolean(comparisonFilters);

    if (error) {
        return <div style={{ padding: '24px', color: 'var(--color-accent-danger)' }}>Trafik verisi yüklenirken hata oluştu: {error.message}</div>;
    }

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Trafik Analizi</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Oturum, kullanıcı davranışı ve trafik dağılımını izleyin.</p>
            <FilterPanel />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Toplam Oturum" value={traffic.sessions || 0} change={compareEnabled ? calculateChange(traffic.sessions || 0, previousTraffic.sessions || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Tekil Kullanıcı" value={traffic.users || 0} change={compareEnabled ? calculateChange(traffic.users || 0, previousTraffic.users || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Hemen Çıkma Oranı" value={traffic.bounce_rate || 0} suffix="%" change={compareEnabled ? calculateChange(traffic.bounce_rate || 0, previousTraffic.bounce_rate || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Trafik Dönüşüm Oranı" value={traffic.cvr || 0} suffix="%" change={compareEnabled ? calculateChange(traffic.cvr || 0, previousTraffic.cvr || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Yeni Kullanıcı" value={traffic.new_users || 0} change={compareEnabled ? calculateChange(traffic.new_users || 0, previousTraffic.new_users || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Ort. Oturum Süresi (sn)" value={traffic.avg_duration || 0} suffix="s" change={compareEnabled ? calculateChange(traffic.avg_duration || 0, previousTraffic.avg_duration || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <TrendChart data={trendData || []} isLoading={isTrendLoading} />
                <div style={{ display: 'flex', gap: '24px' }}>
                    <DonutChart data={donutData} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}
