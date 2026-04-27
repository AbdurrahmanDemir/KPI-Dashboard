import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import KpiCard from '../components/ui/KpiCard';
import api from '../services/api';
import {
    buildComparisonFilters,
    buildQueryString,
    calculateChange,
    getComparisonLabel
} from '../utils/filterComparison';

export default function SalesAnalysisPage() {
    const { filters } = useFilterStore();
    const queryString = buildQueryString(filters);
    const comparisonFilters = buildComparisonFilters(filters);
    const comparisonQueryString = comparisonFilters ? buildQueryString(comparisonFilters) : '';
    const comparisonLabel = filters.compare_previous_period
        ? `onceki donem (${getComparisonLabel(filters)})`
        : 'onceki donem';

    const { data: summaryData, isLoading, error } = useQuery({
        queryKey: ['kpi-summary', queryString],
        queryFn: async () => {
            const res = await api.get(`/kpi/summary?${queryString}`);
            return res.data.data;
        }
    });

    const { data: comparisonSummaryData } = useQuery({
        enabled: Boolean(comparisonFilters),
        queryKey: ['sales-summary-comparison', comparisonQueryString],
        queryFn: async () => {
            const res = await api.get(`/kpi/summary?${comparisonQueryString}`);
            return res.data.data;
        }
    });

    const s = summaryData?.sales || {};
    const prevSales = comparisonSummaryData?.sales || {};
    const cityData = summaryData?.breakdowns?.sales_by_city || [];
    const adFormatDataRaw = summaryData?.breakdowns?.sales_by_ad_format || [];
    
    const donutData = cityData.slice(0, 5).map((city) => ({
        platform: city.city,
        sessions: city.revenue
    }));

    const adFormatData = adFormatDataRaw.map((d) => ({
        channel: d.format,
        revenue: d.revenue
    }));
    const compareEnabled = Boolean(comparisonFilters);

    if (error) {
        return <div style={{ padding: '24px', color: 'var(--color-accent-danger)' }}>Satış verisi yüklenirken hata oluştu: {error.message}</div>;
    }

    const columns = [
        { key: 'city', label: 'Şehir', sortable: true },
        { key: 'orders', label: 'Sipariş Sayısı', sortable: true, formatter: (v) => v.toLocaleString('tr-TR') },
        { key: 'revenue', label: 'Net Ciro (₺)', sortable: true, formatter: (v) => `₺${v.toLocaleString('tr-TR')}` },
        { key: 'refund_rate', label: 'İade Oranı (%)', sortable: true, formatter: (v) => `%${v.toFixed(1)}` },
    ];

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Satış ve Coğrafi Analiz</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Bölgelere göre satış performansını, iade oranlarını ve sepet ortalamalarını inceleyin.
            </p>

            <FilterPanel />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Toplam Ciro" value={s.revenue || 0} prefix="₺" change={compareEnabled ? calculateChange(s.revenue || 0, prevSales.revenue || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Toplam Sipariş" value={s.orders || 0} change={compareEnabled ? calculateChange(s.orders || 0, prevSales.orders || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Sepet Ortalaması (AOV)" value={s.aov || 0} prefix="₺" change={compareEnabled ? calculateChange(s.aov || 0, prevSales.aov || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="İade Tutarı" value={s.refund_amount || 0} prefix="₺" change={compareEnabled ? calculateChange(s.refund_amount || 0, prevSales.refund_amount || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="İade Oranı" value={s.refund_rate || 0} suffix="%" change={compareEnabled ? calculateChange(s.refund_rate || 0, prevSales.refund_rate || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Tekrar Satın Alma" value={s.repeat_purchase_rate || 0} suffix="%" change={compareEnabled ? calculateChange(s.repeat_purchase_rate || 0, prevSales.repeat_purchase_rate || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                <DonutChart data={donutData} isLoading={isLoading} />
                <BarChart data={adFormatData} isLoading={isLoading} title="Reklam Formatına Göre Ciro (Video, Görsel vb.)" />
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                    <DataTable
                        title="Sehir Bazli Satis Performansi"
                        columns={columns}
                        data={cityData}
                        exportFileName="sehir_satis_performans.csv"
                        rowsPerPage={5}
                        isLoading={isLoading}
                        enableGrouping
                        groupByOptions={['city']}
                    />
                </div>
                
                <div style={{ flex: 1 }}>
                    <DataTable
                        title="Reklam Formatı Analizi"
                        columns={[
                            { key: 'format', label: 'Reklam Formatı', sortable: true },
                            { key: 'orders', label: 'Sipariş Sayısı', sortable: true, formatter: (v) => v.toLocaleString('tr-TR') },
                            { key: 'revenue', label: 'Net Ciro (₺)', sortable: true, formatter: (v) => `₺${v.toLocaleString('tr-TR')}` }
                        ]}
                        data={adFormatDataRaw}
                        exportFileName="reklam_formati_satis_performans.csv"
                        rowsPerPage={5}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}
