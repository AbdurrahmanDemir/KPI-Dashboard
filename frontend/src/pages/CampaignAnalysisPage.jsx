import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import ScatterChart from '../components/charts/ScatterChart';
import KpiCard from '../components/ui/KpiCard';
import {
    buildComparisonFilters,
    buildQueryString,
    calculateChange,
    getComparisonLabel
} from '../utils/filterComparison';

export default function CampaignAnalysisPage() {
    const { filters } = useFilterStore();
    const queryString = buildQueryString(filters);
    const comparisonFilters = buildComparisonFilters(filters);
    const comparisonQueryString = comparisonFilters ? buildQueryString(comparisonFilters) : '';
    const comparisonLabel = filters.compare_previous_period
        ? `onceki donem (${getComparisonLabel(filters)})`
        : 'onceki donem';

    const { data, isLoading, error } = useQuery({
        queryKey: ['campaign-performance', queryString],
        queryFn: async () => (await api.get(`/dashboard/campaign-performance?${queryString}`)).data.data || []
    });

    const { data: campaignProductRows = [], isLoading: isCampaignProductLoading } = useQuery({
        queryKey: ['campaign-product-performance', queryString],
        queryFn: async () => (await api.get(`/dashboard/campaign-product-performance?${queryString}`)).data.data || []
    });

    const { data: monthlyBrandRows = [], isLoading: isMonthlyBrandLoading } = useQuery({
        queryKey: ['monthly-brand-sales', queryString],
        queryFn: async () => (await api.get(`/dashboard/monthly-brand-sales?${queryString}`)).data.data || []
    });

    const { data: monthlyCampaignRows = [], isLoading: isMonthlyCampaignLoading } = useQuery({
        queryKey: ['monthly-campaign-sales', queryString],
        queryFn: async () => (await api.get(`/dashboard/monthly-campaign-sales?${queryString}`)).data.data || []
    });

    const { data: comparisonData = [] } = useQuery({
        enabled: Boolean(comparisonFilters),
        queryKey: ['campaign-performance-comparison', comparisonQueryString],
        queryFn: async () => (await api.get(`/dashboard/campaign-performance?${comparisonQueryString}`)).data.data || []
    });

    const rows = data || [];
    const previousRows = comparisonData || [];
    const googleRows = rows.filter((row) => row.platform === 'Google Ads' || row.platform === 'google_ads');
    const metaRows = rows.filter((row) => row.platform === 'Meta Ads' || row.platform === 'meta');

    // Özet hesaplamalar
    const totalSpend = rows.reduce((sum, r) => sum + (r.spend || 0), 0);
    const totalRevenue = rows.reduce((sum, r) => sum + (r.analytics_revenue || 0), 0);
    const totalConversions = rows.reduce((sum, r) => sum + (r.conversions || 0), 0);
    const avgRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : 0;
    const previousTotalSpend = previousRows.reduce((sum, r) => sum + (r.spend || 0), 0);
    const previousTotalRevenue = previousRows.reduce((sum, r) => sum + (r.analytics_revenue || 0), 0);
    const previousTotalConversions = previousRows.reduce((sum, r) => sum + (r.conversions || 0), 0);
    const previousAvgRoas = previousTotalSpend > 0 ? (previousTotalRevenue / previousTotalSpend) : 0;
    const compareEnabled = Boolean(comparisonFilters);

    const columns = [
        { key: 'campaign_name', label: 'Kampanya', sortable: true },
        { key: 'platform', label: 'Platform', sortable: true },
        { key: 'spend', label: 'Harcama (₺)', sortable: true, formatter: (v) => `₺${Number(v).toLocaleString('tr-TR')}` },
        { key: 'clicks', label: 'Tıklama', sortable: true, formatter: (v) => Number(v).toLocaleString('tr-TR') },
        { key: 'ctr', label: 'CTR (%)', sortable: true, formatter: (v) => `%${Number(v).toFixed(2)}` },
        { key: 'conversions', label: 'Dönüşüm', sortable: true, formatter: (v) => Number(v).toLocaleString('tr-TR') },
        { key: 'analytics_revenue', label: 'Analytics Ciro (₺)', sortable: true, formatter: (v) => `₺${Number(v).toLocaleString('tr-TR')}` },
        { key: 'analytics_roas', label: 'Analytics ROAS', sortable: true, formatter: (v) => `${Number(v).toFixed(2)}x` }
    ];

    const campaignProductColumns = [
        { key: 'campaign_name', label: 'Kampanya', sortable: true },
        { key: 'platform', label: 'Platform', sortable: true },
        { key: 'brand', label: 'Marka', sortable: true },
        { key: 'product_name', label: 'Urun', sortable: true },
        { key: 'analytics_revenue', label: 'Ciro', sortable: true, formatter: (v) => `₺${Number(v || 0).toLocaleString('tr-TR')}` },
        { key: 'estimated_spend', label: 'Tahmini Harcama', sortable: true, formatter: (v) => `₺${Number(v || 0).toLocaleString('tr-TR')}` },
        { key: 'estimated_roas', label: 'Tahmini ROAS', sortable: true, formatter: (v) => `${Number(v || 0).toFixed(2)}x` },
        { key: 'orders', label: 'Siparis', sortable: true },
        { key: 'items_sold', label: 'Adet', sortable: true }
    ];

    const monthlyBrandColumns = [
        { key: 'month', label: 'Ay', sortable: true },
        { key: 'brand', label: 'Marka', sortable: true },
        { key: 'revenue', label: 'Ciro', sortable: true, formatter: (v) => `₺${Number(v || 0).toLocaleString('tr-TR')}` },
        { key: 'orders', label: 'Siparis', sortable: true },
        { key: 'items_sold', label: 'Adet', sortable: true },
        { key: 'aov', label: 'AOV', sortable: true, formatter: (v) => `₺${Number(v || 0).toLocaleString('tr-TR')}` }
    ];

    const monthlyCampaignColumns = [
        { key: 'month', label: 'Ay', sortable: true },
        { key: 'campaign_name', label: 'Kampanya', sortable: true },
        { key: 'revenue', label: 'Ciro', sortable: true, formatter: (v) => `₺${Number(v || 0).toLocaleString('tr-TR')}` },
        { key: 'orders', label: 'Siparis', sortable: true },
        { key: 'items_sold', label: 'Adet', sortable: true },
        { key: 'aov', label: 'AOV', sortable: true, formatter: (v) => `₺${Number(v || 0).toLocaleString('tr-TR')}` }
    ];

    if (error) {
        return (
            <div style={{ padding: '24px', color: 'var(--color-accent-danger)' }}>
                Kampanya verisi yüklenirken hata oluştu: {error.message}
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Kampanya Analizi</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Kampanya bazlı harcama, dönüşüm ve ROAS değerlerini inceleyin.
            </p>

            <FilterPanel />

            {/* Özet KPI Kartları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Toplam Harcama" value={totalSpend} prefix="₺" change={compareEnabled ? calculateChange(totalSpend, previousTotalSpend) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Analytics Ciro" value={totalRevenue} prefix="₺" change={compareEnabled ? calculateChange(totalRevenue, previousTotalRevenue) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Ortalama ROAS" value={Number(avgRoas)} suffix="x" change={compareEnabled ? calculateChange(Number(avgRoas), previousAvgRoas) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Toplam Dönüşüm" value={totalConversions} change={compareEnabled ? calculateChange(totalConversions, previousTotalConversions) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
            </div>

            {/* Scatter Chart */}
            <div style={{ marginBottom: '24px' }}>
                <ScatterChart data={rows} isLoading={isLoading} title="ROAS vs Harcama Dağılımı (Kampanya Bazlı)" />
            </div>

            {/* Detay Tablosu */}
            <DataTable
                title="Kampanya Performans Tablosu"
                columns={columns}
                data={rows}
                exportFileName="kampanya_performansi.csv"
                rowsPerPage={10}
                isLoading={isLoading}
                enableGrouping
                groupByOptions={['platform', 'campaign_name']}
            />

            <div style={{ height: '24px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
                <DataTable
                    title="Google Ads Kampanyalari"
                    columns={columns}
                    data={googleRows}
                    exportFileName="google_ads_kampanyalari.csv"
                    rowsPerPage={6}
                    isLoading={isLoading}
                    enableGrouping
                    groupByOptions={['campaign_name']}
                />
                <DataTable
                    title="Meta Ads Kampanyalari"
                    columns={columns}
                    data={metaRows}
                    exportFileName="meta_ads_kampanyalari.csv"
                    rowsPerPage={6}
                    isLoading={isLoading}
                    enableGrouping
                    groupByOptions={['campaign_name']}
                />
            </div>

            <div style={{ height: '24px' }} />

            <DataTable
                title="Kampanya Bazinda Urun Harcama ve Satis"
                columns={campaignProductColumns}
                data={campaignProductRows}
                exportFileName="kampanya_urun_harcama_satis.csv"
                rowsPerPage={10}
                isLoading={isCampaignProductLoading}
                enableGrouping
                groupByOptions={['campaign_name', 'brand', 'platform']}
            />

            <div style={{ height: '24px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
                <DataTable
                    title="Aylik Marka Satis Liderleri"
                    columns={monthlyBrandColumns}
                    data={monthlyBrandRows}
                    exportFileName="aylik_marka_satislari.csv"
                    rowsPerPage={8}
                    isLoading={isMonthlyBrandLoading}
                    enableGrouping
                    groupByOptions={['month', 'brand']}
                />
                <DataTable
                    title="Aylik Kampanya Satis Liderleri"
                    columns={monthlyCampaignColumns}
                    data={monthlyCampaignRows}
                    exportFileName="aylik_kampanya_satislari.csv"
                    rowsPerPage={8}
                    isLoading={isMonthlyCampaignLoading}
                    enableGrouping
                    groupByOptions={['month', 'campaign_name']}
                />
            </div>
        </div>
    );
}
