import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
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

const cardStyle = {
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

const normalizeChannel = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

const getChannelKey = (row) => normalizeChannel(row.channel || row.platform);

function ChartCard({ title, subtitle, children }) {
    return (
        <div style={cardStyle}>
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{title}</h3>
                {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

function MetricDelta({ a, b, type, suffix = '' }) {
    const diff = Number(a || 0) - Number(b || 0);
    const color = diff > 0 ? 'var(--color-accent-success)' : diff < 0 ? 'var(--color-accent-danger)' : 'var(--color-text-muted)';
    const value = type === 'currency'
        ? formatCurrency(diff)
        : `${diff > 0 ? '+' : ''}${formatNumber(diff)}${type === 'percent' ? ' puan' : suffix}`;

    return <span style={{ color, fontWeight: 700 }}>{value}</span>;
}

export default function ChannelAnalysisPage() {
    const { filters, setFilter } = useFilterStore();
    const [selectedChannelA, setSelectedChannelA] = useState('');
    const [selectedChannelB, setSelectedChannelB] = useState('');
    const queryString = buildQueryString(filters);
    const comparisonFilters = buildComparisonFilters(filters);
    const comparisonQueryString = comparisonFilters ? buildQueryString(comparisonFilters) : '';
    const comparisonLabel = filters.compare_previous_period
        ? `?nceki d?nem (${getComparisonLabel(filters)})`
        : '?nceki d?nem';

    const { data: channelRevenueRows = [], isLoading, error } = useQuery({
        queryKey: ['channel-performance', queryString],
        queryFn: async () => (await api.get(`/dashboard/channel-performance?${queryString}`)).data.data || []
    });

    const { data: comparisonData = [] } = useQuery({
        enabled: Boolean(comparisonFilters),
        queryKey: ['channel-performance-comparison', comparisonQueryString],
        queryFn: async () => (await api.get(`/dashboard/channel-performance?${comparisonQueryString}`)).data.data || []
    });

    const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
        queryKey: ['channel-summary-detail', queryString],
        queryFn: async () => (await api.get(`/kpi/summary?${queryString}`)).data.data
    });

    const { data: attributionData, isLoading: isAttributionLoading } = useQuery({
        queryKey: ['channel-attribution-detail', queryString],
        queryFn: async () => (await api.get(`/dashboard/attribution-analysis?${queryString}`)).data.data
    });

    const { data: campaignRows = [], isLoading: isCampaignLoading } = useQuery({
        queryKey: ['channel-campaign-performance', queryString],
        queryFn: async () => (await api.get(`/dashboard/campaign-performance?${queryString}`)).data.data || []
    });

    const rows = channelRevenueRows || [];
    const previousRows = comparisonData || [];
    const marketingRows = summaryData?.breakdowns?.marketing_channels || [];
    const attributionRows = attributionData?.rows || summaryData?.attribution?.rows || [];

    const enrichedRows = useMemo(() => {
        const marketingByChannel = new Map(marketingRows.map((row) => [getChannelKey(row), row]));
        const attributionByChannel = new Map(attributionRows.map((row) => [getChannelKey(row), row]));
        const keys = new Set([
            ...rows.map(getChannelKey),
            ...marketingRows.map(getChannelKey),
            ...attributionRows.map(getChannelKey)
        ]);
        const totalAnalyticsRevenue = sumBy(marketingRows, 'analytics_revenue') || sumBy(attributionRows, 'analytics_revenue') || sumBy(rows, 'revenue');
        const maxRoas = Math.max(...marketingRows.map((row) => Number(row.roas || row.analytics_roas || 0)), 0);
        const maxRevenue = Math.max(...marketingRows.map((row) => Number(row.analytics_revenue || row.revenue || 0)), ...rows.map((row) => Number(row.revenue || 0)), 0);
        const maxCvr = Math.max(...attributionRows.map((row) => Number(row.cvr ?? row.analytics_cvr ?? 0)), 0);

        return Array.from(keys).map((key) => {
            const revenueRow = rows.find((row) => getChannelKey(row) === key) || {};
            const marketing = marketingByChannel.get(key) || {};
            const attribution = attributionByChannel.get(key) || {};
            const spend = Number(marketing.spend || 0);
            const clicks = Number(marketing.clicks || 0);
            const impressions = Number(marketing.impressions || 0);
            const sessions = Number(attribution.sessions ?? attribution.analytics_sessions ?? marketing.sessions ?? 0);
            const orders = Number(attribution.orders ?? attribution.analytics_orders ?? marketing.orders ?? 0);
            const analyticsRevenue = Number(marketing.analytics_revenue ?? attribution.analytics_revenue ?? revenueRow.revenue ?? 0);
            const channelRevenue = Number(revenueRow.revenue ?? analyticsRevenue);
            const platformRevenue = Number(marketing.revenue ?? attribution.platform_revenue ?? 0);
            const analyticsRoas = Number(marketing.roas ?? marketing.analytics_roas ?? ratio(analyticsRevenue, spend));
            const cvr = Number(attribution.cvr ?? attribution.analytics_cvr ?? ratio(orders, sessions, 100));

            return {
                channel: revenueRow.channel || marketing.channel || attribution.channel || key || 'Bilinmiyor',
                revenue: channelRevenue,
                spend,
                impressions,
                clicks,
                sessions,
                orders,
                analytics_revenue: analyticsRevenue,
                platform_revenue: platformRevenue,
                ctr: Number(marketing.ctr ?? ratio(clicks, impressions, 100)),
                cpc: ratio(spend, clicks),
                cpa: ratio(spend, orders),
                cvr,
                platform_roas: Number(marketing.platform_roas ?? ratio(platformRevenue, spend)),
                roas: analyticsRoas,
                attribution_gap: Number(attribution.attribution_gap ?? attribution.total_gap ?? (platformRevenue - analyticsRevenue)),
                revenue_share: ratio(analyticsRevenue || channelRevenue, totalAnalyticsRevenue, 100),
                efficiency_score: Math.round(
                    (maxRoas > 0 ? (analyticsRoas / maxRoas) * 45 : 0)
                    + (maxRevenue > 0 ? ((analyticsRevenue || channelRevenue) / maxRevenue) * 35 : 0)
                    + (maxCvr > 0 ? (cvr / maxCvr) * 20 : 0)
                ),
                diagnosis: attribution.diagnosis || ''
            };
        }).sort((a, b) => (b.analytics_revenue || b.revenue) - (a.analytics_revenue || a.revenue));
    }, [attributionRows, marketingRows, rows]);

    const channelOptions = useMemo(() => enrichedRows.map(getChannelKey), [enrichedRows]);

    useEffect(() => {
        if (!channelOptions.length) return;
        setSelectedChannelA((current) => channelOptions.includes(current) ? current : channelOptions[0]);
        setSelectedChannelB((current) => channelOptions.includes(current) ? current : channelOptions[1] || channelOptions[0]);
    }, [channelOptions]);

    const selectedA = enrichedRows.find((row) => getChannelKey(row) === selectedChannelA);
    const selectedB = enrichedRows.find((row) => getChannelKey(row) === selectedChannelB);

    const comparisonMetricRows = useMemo(() => {
        if (!selectedA || !selectedB) return [];
        return [
            { metric: 'Kanal Cirosu', a: selectedA.revenue, b: selectedB.revenue, type: 'currency' },
            { metric: 'Harcama', a: selectedA.spend, b: selectedB.spend, type: 'currency' },
            { metric: 'Analytics Ciro', a: selectedA.analytics_revenue, b: selectedB.analytics_revenue, type: 'currency' },
            { metric: 'Analytics ROAS', a: selectedA.roas, b: selectedB.roas, suffix: 'x' },
            { metric: 'Platform ROAS', a: selectedA.platform_roas, b: selectedB.platform_roas, suffix: 'x' },
            { metric: 'CTR', a: selectedA.ctr, b: selectedB.ctr, type: 'percent' },
            { metric: 'CVR', a: selectedA.cvr, b: selectedB.cvr, type: 'percent' },
            { metric: 'CPC', a: selectedA.cpc, b: selectedB.cpc, type: 'currency' },
            { metric: 'CPA', a: selectedA.cpa, b: selectedB.cpa, type: 'currency' },
            { metric: 'Attribution Gap', a: selectedA.attribution_gap, b: selectedB.attribution_gap, type: 'currency' },
            { metric: 'Gelir Payi', a: selectedA.revenue_share, b: selectedB.revenue_share, type: 'percent' },
            { metric: 'Verimlilik Skoru', a: selectedA.efficiency_score, b: selectedB.efficiency_score }
        ];
    }, [selectedA, selectedB]);

    const selectedCampaignRows = useMemo(() => {
        const selectedLabels = new Set([selectedA?.channel, selectedB?.channel].filter(Boolean));
        return campaignRows
            .filter((row) => selectedLabels.has(row.platform))
            .map((row) => ({ ...row, revenue: Number(row.analytics_revenue || 0) }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
    }, [campaignRows, selectedA, selectedB]);

    const totalRevenue = sumBy(rows, 'revenue');
    const topChannel = rows[0];
    const previousTotalRevenue = sumBy(previousRows, 'revenue');
    const previousTopChannelRevenue = previousRows[0]?.revenue || 0;
    const compareEnabled = Boolean(comparisonFilters);
    const donutData = rows.map((row) => ({ platform: row.channel, sessions: row.revenue }));

    const handleChannelClick = useCallback((channelLabel) => {
        const channelMap = {
            'Meta Ads': 'meta',
            'Google Ads': 'google_ads',
            Organic: 'organic',
            Direct: 'direct',
            Email: 'email',
            TikTok: 'tiktok',
        };
        const value = channelMap[channelLabel] || normalizeChannel(channelLabel);
        setFilter('channel', filters.channel === value ? '' : value);
    }, [filters.channel, setFilter]);

    const columns = [
        { key: 'channel', label: 'Kanal', sortable: true },
        { key: 'revenue', label: 'Kanal Cirosu', sortable: true, formatter: formatCurrency },
        { key: 'spend', label: 'Harcama', sortable: true, formatter: formatCurrency },
        { key: 'analytics_revenue', label: 'Analytics Ciro', sortable: true, formatter: formatCurrency },
        { key: 'roas', label: 'Analytics ROAS', sortable: true, formatter: formatMultiplier, aggregate: (groupRows) => ratio(sumBy(groupRows, 'analytics_revenue'), sumBy(groupRows, 'spend')) },
        { key: 'ctr', label: 'CTR', sortable: true, formatter: formatPercent, aggregate: (groupRows) => ratio(sumBy(groupRows, 'clicks'), sumBy(groupRows, 'impressions'), 100) },
        { key: 'cvr', label: 'CVR', sortable: true, formatter: formatPercent, aggregate: (groupRows) => ratio(sumBy(groupRows, 'orders'), sumBy(groupRows, 'sessions'), 100) },
        { key: 'cpc', label: 'CPC', sortable: true, formatter: formatCurrency, aggregate: (groupRows) => ratio(sumBy(groupRows, 'spend'), sumBy(groupRows, 'clicks')) },
        { key: 'cpa', label: 'CPA', sortable: true, formatter: formatCurrency, aggregate: (groupRows) => ratio(sumBy(groupRows, 'spend'), sumBy(groupRows, 'orders')) },
        { key: 'attribution_gap', label: 'Attribution Gap', sortable: true, formatter: formatCurrency },
        { key: 'revenue_share', label: 'Gelir Payi', sortable: true, formatter: formatPercent },
        { key: 'efficiency_score', label: 'Skor', sortable: true }
    ];

    const comparisonColumns = [
        { key: 'metric', label: 'Metrik', sortable: true },
        { key: 'a', label: selectedA?.channel || 'Kanal A', sortable: true, formatter: (value, row) => row.type === 'currency' ? formatCurrency(value) : row.type === 'percent' ? formatPercent(value) : `${formatNumber(value)}${row.suffix || ''}` },
        { key: 'b', label: selectedB?.channel || 'Kanal B', sortable: true, formatter: (value, row) => row.type === 'currency' ? formatCurrency(value) : row.type === 'percent' ? formatPercent(value) : `${formatNumber(value)}${row.suffix || ''}` },
        { key: 'delta', label: 'Fark', sortable: false, formatter: (_, row) => <MetricDelta a={row.a} b={row.b} type={row.type} suffix={row.suffix || ''} /> }
    ];

    const normalizeMetric = (value, max) => max > 0 ? Math.round((Number(value || 0) / max) * 100) : 0;
    const radarMax = {
        roas: Math.max(selectedA?.roas || 0, selectedB?.roas || 0),
        revenue: Math.max(selectedA?.analytics_revenue || selectedA?.revenue || 0, selectedB?.analytics_revenue || selectedB?.revenue || 0),
        ctr: Math.max(selectedA?.ctr || 0, selectedB?.ctr || 0),
        cvr: Math.max(selectedA?.cvr || 0, selectedB?.cvr || 0),
        score: Math.max(selectedA?.efficiency_score || 0, selectedB?.efficiency_score || 0)
    };
    const radarSeries = selectedA && selectedB ? [
        { name: selectedA.channel, data: [normalizeMetric(selectedA.roas, radarMax.roas), normalizeMetric(selectedA.analytics_revenue || selectedA.revenue, radarMax.revenue), normalizeMetric(selectedA.ctr, radarMax.ctr), normalizeMetric(selectedA.cvr, radarMax.cvr), normalizeMetric(selectedA.efficiency_score, radarMax.score)] },
        { name: selectedB.channel, data: [normalizeMetric(selectedB.roas, radarMax.roas), normalizeMetric(selectedB.analytics_revenue || selectedB.revenue, radarMax.revenue), normalizeMetric(selectedB.ctr, radarMax.ctr), normalizeMetric(selectedB.cvr, radarMax.cvr), normalizeMetric(selectedB.efficiency_score, radarMax.score)] }
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

    const selectedChannelChartOptions = {
        chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: 'var(--font-sans)' },
        colors: ['#0085db', '#10b981'],
        plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
        dataLabels: { enabled: false },
        xaxis: { categories: [selectedA?.channel, selectedB?.channel].filter(Boolean), labels: { style: { colors: 'var(--color-text-muted)' } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: 'var(--color-text-muted)' }, formatter: formatCurrency } },
        grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 },
        legend: { labels: { colors: 'var(--color-text-secondary)' } },
        tooltip: { theme: 'dark', y: { formatter: formatCurrency } }
    };

    const campaignContributionOptions = {
        chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: 'var(--font-sans)' },
        colors: ['#8763da'],
        plotOptions: { bar: { borderRadius: 4, horizontal: true } },
        dataLabels: { enabled: false },
        xaxis: { labels: { style: { colors: 'var(--color-text-muted)' }, formatter: formatCurrency } },
        yaxis: { labels: { style: { colors: 'var(--color-text-muted)', fontSize: '11px' } } },
        grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 },
        tooltip: { theme: 'dark', y: { formatter: formatCurrency } }
    };

    if (error) {
        return (
            <div style={{ padding: '24px', color: 'var(--color-accent-danger)' }}>
                Kanal verisi yüklenirken hata oluştu: {error.message}
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Kanal Analizi</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Kanalları ciro, harcama, ROAS, CTR, CVR, CPA ve attribution farki uzerinden karşılaştırın.
            </p>

            <FilterPanel />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Toplam Ciro" value={totalRevenue} prefix="TL " change={compareEnabled ? calculateChange(totalRevenue, previousTotalRevenue) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Aktif Kanal Sayısı" value={rows.length} isLoading={isLoading} />
                <KpiCard title="En İyi Kanal Ciro" value={topChannel?.revenue || 0} prefix="TL " change={compareEnabled ? calculateChange(topChannel?.revenue || 0, previousTopChannelRevenue) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} subtitle={topChannel?.channel || '-'} />
                <KpiCard title="En Iyi Kanal Payi" value={totalRevenue > 0 && topChannel ? ((topChannel.revenue / totalRevenue) * 100).toFixed(1) : 0} suffix="%" isLoading={isLoading} />
            </div>

            {filters.channel && (
                <div style={{ marginBottom: '24px', padding: '10px 16px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid var(--color-accent-primary)', fontSize: '13px', color: 'var(--color-accent-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Aktif Cross-Filter: <b>{filters.channel}</b></span>
                    <button onClick={() => setFilter('channel', '')} style={{ background: 'var(--color-accent-primary)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, padding: '4px 10px', borderRadius: '4px' }}>
                        Tüm Kanalları Göster
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <BarChart data={rows} isLoading={isLoading} onBarClick={handleChannelClick} title="Kanal Bazlı Ciro" />
                <DonutChart data={donutData} isLoading={isLoading} title="Kanal Ciro Payi" />
            </div>

            <div style={comparisonSectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                            Karşılaştırma Modülü
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>İnteraktif Kanal Karşılaştırma</h2>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                            İki kanalı seçin; ciro, maliyet, verimlilik ve attribution farklarıni aynı bölümde karşılaştırın.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <select value={selectedChannelA} onChange={(event) => setSelectedChannelA(event.target.value)} style={{ minWidth: '220px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                            {enrichedRows.map((row) => <option key={getChannelKey(row)} value={getChannelKey(row)}>{row.channel}</option>)}
                        </select>
                        <select value={selectedChannelB} onChange={(event) => setSelectedChannelB(event.target.value)} style={{ minWidth: '220px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                            {enrichedRows.map((row) => <option key={getChannelKey(row)} value={getChannelKey(row)}>{row.channel}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                    <DataTable title="Seçili Kanal Metrikleri" columns={comparisonColumns} data={comparisonMetricRows} exportFileName="kanal-karşılaştırma.csv" rowsPerPage={12} isLoading={isLoading || isSummaryLoading || isAttributionLoading} />
                    <ChartCard title="Normalize Performans Profili">
                        <Chart options={radarOptions} series={radarSeries} type="radar" height={330} />
                    </ChartCard>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    <ChartCard title="Harcama - Analytics Ciro">
                        <Chart
                            options={selectedChannelChartOptions}
                            series={[
                                { name: 'Harcama', data: [selectedA?.spend || 0, selectedB?.spend || 0] },
                                { name: 'Analytics Ciro', data: [selectedA?.analytics_revenue || selectedA?.revenue || 0, selectedB?.analytics_revenue || selectedB?.revenue || 0] }
                            ]}
                            type="bar"
                            height={320}
                        />
                    </ChartCard>
                    <ChartCard title="Seçili Kanallardaki En Büyük Kampanyalar" subtitle="Analytics ciroya göre sıralanır">
                        <Chart
                            options={campaignContributionOptions}
                            series={[{ name: 'Analytics Ciro', data: selectedCampaignRows.map((row) => ({ x: row.campaign_name, y: row.revenue })) }]}
                            type="bar"
                            height={320}
                        />
                    </ChartCard>
                </div>
            </div>

            <DataTable
                title="Kanal Bazlı Performans"
                columns={columns}
                data={enrichedRows}
                exportFileName="kanal_performansi.csv"
                rowsPerPage={8}
                isLoading={isLoading || isSummaryLoading || isAttributionLoading || isCampaignLoading}
                enableGrouping
                groupByOptions={['channel']}
            />
        </div>
    );
}


