import React, { useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
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

const sumBy = (rows, key) => rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
const ratio = (numerator, denominator, multiplier = 1) => denominator > 0 ? (numerator / denominator) * multiplier : 0;
const formatCurrency = (value) => `TL ${Number(value || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
const formatNumber = (value) => Number(value || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
const formatPercent = (value) => `%${Number(value || 0).toFixed(2)}`;
const formatMultiplier = (value) => `${Number(value || 0).toFixed(2)}x`;

const chartCardStyle = {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '20px'
};

const comparisonSectionStyle = {
    background: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px'
};

function ChartCard({ title, subtitle, children }) {
    return (
        <div style={chartCardStyle}>
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>{title}</h3>
                {subtitle && <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

function MetricDelta({ a, b, type, suffix = '' }) {
    const diff = Number(a || 0) - Number(b || 0);
    const color = diff > 0 ? 'var(--color-accent-success)' : diff < 0 ? 'var(--color-accent-danger)' : 'var(--color-text-muted)';
    const value = type === 'currency' ? formatCurrency(diff) : `${diff > 0 ? '+' : ''}${formatNumber(diff)}${type === 'percent' ? ' puan' : suffix}`;

    return <span style={{ color, fontWeight: 700 }}>{value}</span>;
}

const getCampaignKey = (row) => `${row.platform}::${row.campaign_name}`;

export default function CampaignAnalysisPage() {
    const { filters } = useFilterStore();
    const [selectedCampaignA, setSelectedCampaignA] = useState('');
    const [selectedCampaignB, setSelectedCampaignB] = useState('');
    const queryString = buildQueryString(filters);
    const comparisonFilters = buildComparisonFilters(filters);
    const comparisonQueryString = comparisonFilters ? buildQueryString(comparisonFilters) : '';
    const comparisonLabel = filters.compare_previous_period
        ? `?nceki d?nem (${getComparisonLabel(filters)})`
        : '?nceki d?nem';

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

    const rows = useMemo(() => {
        const rawRows = data || [];
        const totalRevenue = sumBy(rawRows, 'analytics_revenue');
        const maxRoas = Math.max(...rawRows.map((row) => Number(row.analytics_roas || 0)), 0);
        const maxRevenue = Math.max(...rawRows.map((row) => Number(row.analytics_revenue || 0)), 0);
        const maxCvr = Math.max(...rawRows.map((row) => Number(row.analytics_cvr || 0)), 0);

        return rawRows.map((row) => {
            const spend = Number(row.spend || 0);
            const clicks = Number(row.clicks || 0);
            const conversions = Number(row.conversions || 0);
            const analyticsConversions = Number(row.analytics_conversions || 0);
            const analyticsRevenue = Number(row.analytics_revenue || 0);
            const analyticsRoas = Number(row.analytics_roas || 0);
            const analyticsCvr = Number(row.analytics_cvr || 0);

            return {
                ...row,
                cpc: ratio(spend, clicks),
                cpa: ratio(spend, analyticsConversions || conversions),
                click_to_conversion_rate: ratio(analyticsConversions || conversions, clicks, 100),
                revenue_share: ratio(analyticsRevenue, totalRevenue, 100),
                efficiency_score: Math.round(
                    (maxRoas > 0 ? (analyticsRoas / maxRoas) * 45 : 0)
                    + (maxRevenue > 0 ? (analyticsRevenue / maxRevenue) * 35 : 0)
                    + (maxCvr > 0 ? (analyticsCvr / maxCvr) * 20 : 0)
                )
            };
        });
    }, [data]);

    const previousRows = comparisonData || [];
    const googleRows = rows.filter((row) => row.platform === 'Google Ads' || row.platform === 'google_ads');
    const metaRows = rows.filter((row) => row.platform === 'Meta Ads' || row.platform === 'meta');
    const campaignOptions = useMemo(() => rows.map(getCampaignKey), [rows]);
    const topRevenueRows = useMemo(() => [...rows].sort((a, b) => b.analytics_revenue - a.analytics_revenue).slice(0, 8), [rows]);
    const topEfficiencyRows = useMemo(() => [...rows].sort((a, b) => b.efficiency_score - a.efficiency_score).slice(0, 8), [rows]);
    const topCpaRows = useMemo(() => [...rows].filter((row) => row.spend > 0).sort((a, b) => b.cpa - a.cpa).slice(0, 8), [rows]);

    useEffect(() => {
        if (!campaignOptions.length) return;
        setSelectedCampaignA((current) => campaignOptions.includes(current) ? current : campaignOptions[0]);
        setSelectedCampaignB((current) => campaignOptions.includes(current) ? current : campaignOptions[1] || campaignOptions[0]);
    }, [campaignOptions]);

    const selectedA = rows.find((row) => getCampaignKey(row) === selectedCampaignA);
    const selectedB = rows.find((row) => getCampaignKey(row) === selectedCampaignB);

    const comparisonMetricRows = useMemo(() => {
        if (!selectedA || !selectedB) return [];
        return [
            { metric: 'Harcama', a: selectedA.spend, b: selectedB.spend, type: 'currency' },
            { metric: 'Analytics Ciro', a: selectedA.analytics_revenue, b: selectedB.analytics_revenue, type: 'currency' },
            { metric: 'Analytics ROAS', a: selectedA.analytics_roas, b: selectedB.analytics_roas, suffix: 'x' },
            { metric: 'CTR', a: selectedA.ctr, b: selectedB.ctr, type: 'percent' },
            { metric: 'Analytics CVR', a: selectedA.analytics_cvr, b: selectedB.analytics_cvr, type: 'percent' },
            { metric: 'CPC', a: selectedA.cpc, b: selectedB.cpc, type: 'currency' },
            { metric: 'CPA', a: selectedA.cpa, b: selectedB.cpa, type: 'currency' },
            { metric: 'Gelir Payi', a: selectedA.revenue_share, b: selectedB.revenue_share, type: 'percent' },
            { metric: 'Verimlilik Skoru', a: selectedA.efficiency_score, b: selectedB.efficiency_score }
        ];
    }, [selectedA, selectedB]);

    const monthlyComparisonRows = useMemo(() => {
        if (!selectedA || !selectedB) return [];
        const selectedNames = new Set([selectedA.campaign_name, selectedB.campaign_name]);
        return monthlyCampaignRows
            .filter((row) => selectedNames.has(row.campaign_name))
            .sort((a, b) => String(a.month).localeCompare(String(b.month)));
    }, [monthlyCampaignRows, selectedA, selectedB]);

    const totalSpend = sumBy(rows, 'spend');
    const totalRevenue = sumBy(rows, 'analytics_revenue');
    const totalConversions = sumBy(rows, 'conversions');
    const avgRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : 0;
    const previousTotalSpend = sumBy(previousRows, 'spend');
    const previousTotalRevenue = sumBy(previousRows, 'analytics_revenue');
    const previousTotalConversions = sumBy(previousRows, 'conversions');
    const previousAvgRoas = previousTotalSpend > 0 ? (previousTotalRevenue / previousTotalSpend) : 0;
    const compareEnabled = Boolean(comparisonFilters);

    const columns = [
        { key: 'campaign_name', label: 'Kampanya', sortable: true },
        { key: 'platform', label: 'Platform', sortable: true },
        { key: 'spend', label: 'Harcama', sortable: true, formatter: formatCurrency },
        { key: 'impressions', label: 'Gösterim', sortable: true, formatter: (value) => Number(value || 0).toLocaleString('tr-TR') },
        { key: 'clicks', label: 'Tıklama', sortable: true, formatter: (value) => Number(value || 0).toLocaleString('tr-TR') },
        { key: 'ctr', label: 'CTR', sortable: true, formatter: formatPercent, aggregate: (groupRows) => ratio(sumBy(groupRows, 'clicks'), sumBy(groupRows, 'impressions'), 100) },
        { key: 'cpc', label: 'CPC', sortable: true, formatter: formatCurrency, aggregate: (groupRows) => ratio(sumBy(groupRows, 'spend'), sumBy(groupRows, 'clicks')) },
        { key: 'conversions', label: 'Platform Dönüşüm', sortable: true, formatter: (value) => Number(value || 0).toLocaleString('tr-TR') },
        { key: 'analytics_conversions', label: 'Analytics Sipariş', sortable: true, formatter: (value) => Number(value || 0).toLocaleString('tr-TR') },
        { key: 'analytics_cvr', label: 'Analytics CVR', sortable: true, formatter: formatPercent, aggregate: (groupRows) => ratio(sumBy(groupRows, 'analytics_conversions'), sumBy(groupRows, 'sessions'), 100) },
        { key: 'cpa', label: 'CPA', sortable: true, formatter: formatCurrency, aggregate: (groupRows) => ratio(sumBy(groupRows, 'spend'), sumBy(groupRows, 'analytics_conversions') || sumBy(groupRows, 'conversions')) },
        { key: 'platform_revenue', label: 'Platform Ciro', sortable: true, formatter: formatCurrency },
        { key: 'platform_roas', label: 'Platform ROAS', sortable: true, formatter: formatMultiplier, aggregate: (groupRows) => ratio(sumBy(groupRows, 'platform_revenue'), sumBy(groupRows, 'spend')) },
        { key: 'analytics_revenue', label: 'Analytics Ciro', sortable: true, formatter: formatCurrency },
        { key: 'analytics_roas', label: 'Analytics ROAS', sortable: true, formatter: formatMultiplier, aggregate: (groupRows) => ratio(sumBy(groupRows, 'analytics_revenue'), sumBy(groupRows, 'spend')) },
        { key: 'revenue_share', label: 'Gelir Payi', sortable: true, formatter: formatPercent },
        {
            key: 'efficiency_score',
            label: 'Skor',
            sortable: true,
            formatter: (value) => (
                <span style={{
                    display: 'inline-flex',
                    minWidth: '42px',
                    justifyContent: 'center',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    color: Number(value) >= 70 ? '#047857' : Number(value) >= 40 ? '#92400e' : '#b91c1c',
                    background: Number(value) >= 70 ? 'rgba(16, 185, 129, 0.14)' : Number(value) >= 40 ? 'rgba(245, 158, 11, 0.16)' : 'rgba(239, 68, 68, 0.14)'
                }}>
                    {value}
                </span>
            )
        }
    ];

    const campaignProductColumns = [
        { key: 'campaign_name', label: 'Kampanya', sortable: true },
        { key: 'platform', label: 'Platform', sortable: true },
        { key: 'brand', label: 'Marka', sortable: true },
        { key: 'product_name', label: 'Ürün', sortable: true },
        { key: 'analytics_revenue', label: 'Ciro', sortable: true, formatter: formatCurrency },
        { key: 'estimated_spend', label: 'Tahmini Harcama', sortable: true, formatter: formatCurrency },
        { key: 'estimated_roas', label: 'Tahmini ROAS', sortable: true, formatter: formatMultiplier, aggregate: (groupRows) => ratio(sumBy(groupRows, 'analytics_revenue'), sumBy(groupRows, 'estimated_spend')) },
        { key: 'orders', label: 'Sipariş', sortable: true },
        { key: 'items_sold', label: 'Adet', sortable: true }
    ];

    const monthlyBrandColumns = [
        { key: 'month', label: 'Ay', sortable: true },
        { key: 'brand', label: 'Marka', sortable: true },
        { key: 'revenue', label: 'Ciro', sortable: true, formatter: formatCurrency },
        { key: 'orders', label: 'Sipariş', sortable: true },
        { key: 'items_sold', label: 'Adet', sortable: true },
        { key: 'aov', label: 'AOV', sortable: true, formatter: formatCurrency }
    ];

    const monthlyCampaignColumns = [
        { key: 'month', label: 'Ay', sortable: true },
        { key: 'campaign_name', label: 'Kampanya', sortable: true },
        { key: 'revenue', label: 'Ciro', sortable: true, formatter: formatCurrency },
        { key: 'orders', label: 'Sipariş', sortable: true },
        { key: 'items_sold', label: 'Adet', sortable: true },
        { key: 'aov', label: 'AOV', sortable: true, formatter: formatCurrency }
    ];

    const comparisonColumns = [
        { key: 'metric', label: 'Metrik', sortable: true },
        { key: 'a', label: selectedA?.campaign_name || 'Kampanya A', sortable: true, formatter: (value, row) => row.type === 'currency' ? formatCurrency(value) : row.type === 'percent' ? formatPercent(value) : `${formatNumber(value)}${row.suffix || ''}` },
        { key: 'b', label: selectedB?.campaign_name || 'Kampanya B', sortable: true, formatter: (value, row) => row.type === 'currency' ? formatCurrency(value) : row.type === 'percent' ? formatPercent(value) : `${formatNumber(value)}${row.suffix || ''}` },
        { key: 'delta', label: 'Fark', sortable: false, formatter: (_, row) => <MetricDelta a={row.a} b={row.b} type={row.type} suffix={row.suffix || ''} /> }
    ];

    const barTextStyle = { colors: 'var(--color-text-muted)', fontSize: '11px' };
    const spendRevenueOptions = {
        chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: 'var(--font-sans)' },
        colors: ['#0085db', '#10b981'],
        plotOptions: { bar: { borderRadius: 4, columnWidth: '48%' } },
        dataLabels: { enabled: false },
        xaxis: { categories: topRevenueRows.map((row) => row.campaign_name), labels: { style: barTextStyle, rotate: -35, trim: true }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: 'var(--color-text-muted)' }, formatter: formatCurrency } },
        grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 },
        legend: { labels: { colors: 'var(--color-text-secondary)' } },
        tooltip: { theme: 'dark', y: { formatter: formatCurrency } }
    };

    const horizontalOptions = (color, formatter) => ({
        chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: 'var(--font-sans)' },
        colors: [color],
        plotOptions: { bar: { borderRadius: 4, horizontal: true } },
        dataLabels: { enabled: false },
        xaxis: { labels: { style: { colors: 'var(--color-text-muted)' }, formatter } },
        yaxis: { labels: { style: barTextStyle } },
        grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 },
        tooltip: { theme: 'dark', y: { formatter } }
    });

    const normalizeMetric = (value, max) => max > 0 ? Math.round((Number(value || 0) / max) * 100) : 0;
    const radarMax = {
        roas: Math.max(selectedA?.analytics_roas || 0, selectedB?.analytics_roas || 0),
        revenue: Math.max(selectedA?.analytics_revenue || 0, selectedB?.analytics_revenue || 0),
        ctr: Math.max(selectedA?.ctr || 0, selectedB?.ctr || 0),
        cvr: Math.max(selectedA?.analytics_cvr || 0, selectedB?.analytics_cvr || 0),
        score: Math.max(selectedA?.efficiency_score || 0, selectedB?.efficiency_score || 0)
    };
    const radarSeries = selectedA && selectedB ? [
        { name: selectedA.campaign_name, data: [normalizeMetric(selectedA.analytics_roas, radarMax.roas), normalizeMetric(selectedA.analytics_revenue, radarMax.revenue), normalizeMetric(selectedA.ctr, radarMax.ctr), normalizeMetric(selectedA.analytics_cvr, radarMax.cvr), normalizeMetric(selectedA.efficiency_score, radarMax.score)] },
        { name: selectedB.campaign_name, data: [normalizeMetric(selectedB.analytics_roas, radarMax.roas), normalizeMetric(selectedB.analytics_revenue, radarMax.revenue), normalizeMetric(selectedB.ctr, radarMax.ctr), normalizeMetric(selectedB.analytics_cvr, radarMax.cvr), normalizeMetric(selectedB.efficiency_score, radarMax.score)] }
    ] : [];
    const radarOptions = {
        chart: { type: 'radar', toolbar: { show: false }, background: 'transparent', fontFamily: 'var(--font-sans)' },
        colors: ['#0085db', '#10b981'],
        xaxis: { categories: ['ROAS', 'Ciro', 'CTR', 'CVR', 'Skor'], labels: { style: { colors: Array(5).fill('var(--color-text-muted)') } } },
        yaxis: { show: false, max: 100 },
        fill: { opacity: 0.12 },
        stroke: { width: 2 },
        markers: { size: 3 },
        legend: { labels: { colors: 'var(--color-text-secondary)' } },
        tooltip: { theme: 'dark' }
    };

    const monthlyCategories = [...new Set(monthlyComparisonRows.map((row) => row.month))];
    const monthlyTrendSeries = selectedA && selectedB ? [selectedA, selectedB].map((campaign) => ({
        name: campaign.campaign_name,
        data: monthlyCategories.map((month) => {
            const match = monthlyComparisonRows.find((row) => row.month === month && row.campaign_name === campaign.campaign_name);
            return Number(match?.revenue || 0);
        })
    })) : [];
    const monthlyTrendOptions = {
        chart: { type: 'line', toolbar: { show: false }, background: 'transparent', fontFamily: 'var(--font-sans)' },
        colors: ['#0085db', '#10b981'],
        stroke: { curve: 'smooth', width: 3 },
        dataLabels: { enabled: false },
        xaxis: { categories: monthlyCategories, labels: { style: { colors: 'var(--color-text-muted)' } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: 'var(--color-text-muted)' }, formatter: formatCurrency } },
        grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 },
        legend: { labels: { colors: 'var(--color-text-secondary)' } },
        tooltip: { theme: 'dark', y: { formatter: formatCurrency } }
    };

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
                Kampanya bazli harcama, dönüşüm, ciro, ROAS ve verimlilik metriklerini inceleyin.
            </p>

            <FilterPanel />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Toplam Harcama" value={totalSpend} prefix="TL " change={compareEnabled ? calculateChange(totalSpend, previousTotalSpend) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Analytics Ciro" value={totalRevenue} prefix="TL " change={compareEnabled ? calculateChange(totalRevenue, previousTotalRevenue) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Ortalama ROAS" value={Number(avgRoas)} suffix="x" change={compareEnabled ? calculateChange(Number(avgRoas), previousAvgRoas) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Toplam Dönüşüm" value={totalConversions} change={compareEnabled ? calculateChange(totalConversions, previousTotalConversions) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <ScatterChart data={rows} isLoading={isLoading} title="ROAS vs Harcama Dağılımı" />
                <ChartCard title="Harcama - Ciro Karşılaştırması" subtitle="En yüksek analytics ciro getiren kampanyalar">
                    <Chart
                        options={spendRevenueOptions}
                        series={[
                            { name: 'Harcama', data: topRevenueRows.map((row) => row.spend) },
                            { name: 'Analytics Ciro', data: topRevenueRows.map((row) => row.analytics_revenue) }
                        ]}
                        type="bar"
                        height={350}
                    />
                </ChartCard>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <ChartCard title="Verimlilik Skoru" subtitle="ROAS, ciro ve CVR birlikte normalize edilir">
                    <Chart
                        options={horizontalOptions('#8763da', (value) => `${Math.round(value)}/100`)}
                        series={[{ name: 'Skor', data: topEfficiencyRows.map((row) => ({ x: row.campaign_name, y: row.efficiency_score })) }]}
                        type="bar"
                        height={320}
                    />
                </ChartCard>
                <ChartCard title="CPA Riski" subtitle="Sipariş/dönüşüm basina maliyeti en yüksek kampanyalar">
                    <Chart
                        options={horizontalOptions('#fb977d', formatCurrency)}
                        series={[{ name: 'CPA', data: topCpaRows.map((row) => ({ x: row.campaign_name, y: row.cpa })) }]}
                        type="bar"
                        height={320}
                    />
                </ChartCard>
            </div>

            <div style={comparisonSectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                            Karşılaştırma Modülü
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>İnteraktif Kampanya Karşılaştırma</h3>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                            İki kampanya seçin; metrik farklarıni, normalize performans profilini ve ayl?k ciro trendini yan yana görün.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <select value={selectedCampaignA} onChange={(event) => setSelectedCampaignA(event.target.value)} style={{ minWidth: '240px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                            {rows.map((row) => <option key={getCampaignKey(row)} value={getCampaignKey(row)}>{row.platform} - {row.campaign_name}</option>)}
                        </select>
                        <select value={selectedCampaignB} onChange={(event) => setSelectedCampaignB(event.target.value)} style={{ minWidth: '240px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                            {rows.map((row) => <option key={getCampaignKey(row)} value={getCampaignKey(row)}>{row.platform} - {row.campaign_name}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
                    <DataTable title="Seçili Kampanya Metrikleri" columns={comparisonColumns} data={comparisonMetricRows} exportFileName="kampanya_karşılaştırma.csv" rowsPerPage={9} isLoading={isLoading} />
                    <ChartCard title="Normalize Performans Profili">
                        <Chart options={radarOptions} series={radarSeries} type="radar" height={320} />
                    </ChartCard>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <ChartCard title="Aylık Ciro Trendi" subtitle="Seçili kampanyaların satış tarafındaki aylık ciro karşılaştırması">
                        <Chart options={monthlyTrendOptions} series={monthlyTrendSeries} type="line" height={300} />
                    </ChartCard>
                </div>
            </div>

            <DataTable
                title="Detaylı Kampanya Performans Tablosu"
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
                <DataTable title="Google Ads Kampanyalari" columns={columns} data={googleRows} exportFileName="google_ads_kampanyalari.csv" rowsPerPage={6} isLoading={isLoading} enableGrouping groupByOptions={['campaign_name']} />
                <DataTable title="Meta Ads Kampanyalari" columns={columns} data={metaRows} exportFileName="meta_ads_kampanyalari.csv" rowsPerPage={6} isLoading={isLoading} enableGrouping groupByOptions={['campaign_name']} />
            </div>

            <div style={{ height: '24px' }} />

            <DataTable
                title="Kampanya Bazında Ürün Harcama ve Satış"
                columns={campaignProductColumns}
                data={campaignProductRows}
                exportFileName="kampanya_ürün_harcama_satış.csv"
                rowsPerPage={10}
                isLoading={isCampaignProductLoading}
                enableGrouping
                groupByOptions={['campaign_name', 'brand', 'platform']}
            />

            <div style={{ height: '24px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
                <DataTable title="Aylık Marka Satış Liderleri" columns={monthlyBrandColumns} data={monthlyBrandRows} exportFileName="ayl?k_marka_satışlari.csv" rowsPerPage={8} isLoading={isMonthlyBrandLoading} enableGrouping groupByOptions={['month', 'brand']} />
                <DataTable title="Aylık Kampanya Satış Liderleri" columns={monthlyCampaignColumns} data={monthlyCampaignRows} exportFileName="ayl?k_kampanya_satışlari.csv" rowsPerPage={8} isLoading={isMonthlyCampaignLoading} enableGrouping groupByOptions={['month', 'campaign_name']} />
            </div>
        </div>
    );
}


