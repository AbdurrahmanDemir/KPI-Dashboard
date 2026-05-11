import React, { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import BarChart from '../components/charts/BarChart';
import ScatterChart from '../components/charts/ScatterChart';
import KpiCard from '../components/ui/KpiCard';
import api from '../services/api';
import {
    buildComparisonFilters,
    buildQueryString,
    calculateChange,
    getComparisonLabel
} from '../utils/filterComparison';

const sumBy = (rows, key) => rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
const ratio = (numerator, denominator, multiplier = 1) => denominator > 0 ? (numerator / denominator) * multiplier : 0;
const formatCurrency = (value) => `TL ${Number(value || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
const formatPercent = (value) => `%${Number(value || 0).toFixed(2)}`;
const formatMultiplier = (value) => `${Number(value || 0).toFixed(2)}x`;

const sectionCard = {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '20px'
};

const normalizeChannel = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

const getChannelKey = (row) => normalizeChannel(row.channel || row.platform);

function InsightCard({ title, children }) {
    return (
        <div style={sectionCard}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>{title}</h3>
            {children}
        </div>
    );
}

export default function MarketingAnalysisPage() {
    const { filters, setFilter } = useFilterStore();
    const queryString = buildQueryString(filters);
    const comparisonFilters = buildComparisonFilters(filters);
    const comparisonQueryString = comparisonFilters ? buildQueryString(comparisonFilters) : '';
    const comparisonLabel = filters.compare_previous_period
        ? `?nceki d?nem (${getComparisonLabel(filters)})`
        : '?nceki d?nem';

    const { data: summaryData, isLoading, error } = useQuery({
        queryKey: ['kpi-summary', queryString],
        queryFn: async () => {
            const res = await api.get(`/kpi/summary?${queryString}`);
            return res.data.data;
        }
    });

    const { data: attributionData, isLoading: isAttributionLoading, error: attributionError } = useQuery({
        queryKey: ['attribution-analysis', queryString],
        queryFn: async () => {
            const res = await api.get(`/dashboard/attribution-analysis?${queryString}`);
            return res.data.data;
        }
    });

    const { data: comparisonSummaryData } = useQuery({
        enabled: Boolean(comparisonFilters),
        queryKey: ['marketing-summary-comparison', comparisonQueryString],
        queryFn: async () => {
            const res = await api.get(`/kpi/summary?${comparisonQueryString}`);
            return res.data.data;
        }
    });

    const { data: productData = [], isLoading: isProductLoading } = useQuery({
        queryKey: ['product-performance', queryString],
        queryFn: async () => {
            const res = await api.get(`/dashboard/product-performance?${queryString}`);
            return res.data.data || [];
        }
    });

    const { data: campaignData = [], isLoading: isCampaignLoading } = useQuery({
        queryKey: ['campaign-performance', queryString],
        queryFn: async () => {
            const res = await api.get(`/dashboard/campaign-performance?${queryString}`);
            return res.data.data || [];
        }
    });

    const m = summaryData?.ads || {};
    const prevAds = comparisonSummaryData?.ads || {};
    const channelData = summaryData?.breakdowns?.marketing_channels || [];
    const summaryAttribution = summaryData?.attribution?.summary || {};
    const rawAttributionSummary = attributionData?.summary || {};
    const attributionSummary = {
        ...summaryAttribution,
        ...rawAttributionSummary,
        platform_reported_roas: rawAttributionSummary.platform_reported_roas ?? summaryAttribution.platform_reported_roas ?? 0,
        analytics_attributed_roas: rawAttributionSummary.analytics_attributed_roas ?? summaryAttribution.analytics_attributed_roas ?? 0,
        attribution_gap: rawAttributionSummary.attribution_gap ?? rawAttributionSummary.total_gap ?? summaryAttribution.attribution_gap ?? 0
    };
    const prevAttributionSummary = comparisonSummaryData?.attribution?.summary || {};
    const attributionRows = attributionData?.rows || summaryData?.attribution?.rows || [];
    const compareEnabled = Boolean(comparisonFilters);

    const enrichedChannelRows = useMemo(() => {
        const attributionByChannel = new Map(attributionRows.map((row) => [getChannelKey(row), row]));
        return channelData.map((row) => {
            const attribution = attributionByChannel.get(getChannelKey(row)) || {};
            const spend = Number(row.spend || 0);
            const clicks = Number(row.clicks || 0);
            const impressions = Number(row.impressions || 0);
            const sessions = Number(attribution.sessions ?? attribution.analytics_sessions ?? row.sessions ?? 0);
            const orders = Number(attribution.orders ?? attribution.analytics_orders ?? row.orders ?? 0);
            const analyticsRevenue = Number(row.analytics_revenue ?? attribution.analytics_revenue ?? row.revenue ?? 0);
            const platformRevenue = Number(row.revenue ?? attribution.platform_revenue ?? 0);

            return {
                ...row,
                channel: row.channel || attribution.channel || 'Bilinmiyor',
                spend,
                clicks,
                impressions,
                sessions,
                orders,
                analytics_revenue: analyticsRevenue,
                platform_revenue: platformRevenue,
                ctr: Number(row.ctr ?? ratio(clicks, impressions, 100)),
                cvr: Number(attribution.cvr ?? attribution.analytics_cvr ?? ratio(orders, sessions, 100)),
                cpc: ratio(spend, clicks),
                cpa: ratio(spend, orders),
                roas: Number(row.roas ?? row.analytics_roas ?? ratio(analyticsRevenue, spend)),
                platform_roas: Number(row.platform_roas ?? ratio(platformRevenue, spend)),
                attribution_gap: Number(attribution.attribution_gap ?? attribution.total_gap ?? (platformRevenue - analyticsRevenue)),
                diagnosis: attribution.diagnosis || ''
            };
        }).sort((a, b) => b.analytics_revenue - a.analytics_revenue);
    }, [attributionRows, channelData]);

    const topChannel = enrichedChannelRows[0];
    const riskiestChannel = useMemo(() => [...enrichedChannelRows].sort((a, b) => Math.abs(b.attribution_gap) - Math.abs(a.attribution_gap))[0], [enrichedChannelRows]);

    const channelColumns = [
        { key: 'channel', label: 'Kanal / Platform', sortable: true },
        { key: 'spend', label: 'Harcama', sortable: true, formatter: formatCurrency },
        { key: 'analytics_revenue', label: 'Analytics Ciro', sortable: true, formatter: formatCurrency },
        { key: 'roas', label: 'Analytics ROAS', sortable: true, formatter: formatMultiplier, aggregate: (groupRows) => ratio(sumBy(groupRows, 'analytics_revenue'), sumBy(groupRows, 'spend')) },
        { key: 'platform_roas', label: 'Platform ROAS', sortable: true, formatter: formatMultiplier, aggregate: (groupRows) => ratio(sumBy(groupRows, 'platform_revenue'), sumBy(groupRows, 'spend')) },
        { key: 'ctr', label: 'CTR', sortable: true, formatter: formatPercent, aggregate: (groupRows) => ratio(sumBy(groupRows, 'clicks'), sumBy(groupRows, 'impressions'), 100) },
        { key: 'cvr', label: 'CVR', sortable: true, formatter: formatPercent, aggregate: (groupRows) => ratio(sumBy(groupRows, 'orders'), sumBy(groupRows, 'sessions'), 100) },
        { key: 'cpc', label: 'CPC', sortable: true, formatter: formatCurrency, aggregate: (groupRows) => ratio(sumBy(groupRows, 'spend'), sumBy(groupRows, 'clicks')) },
        { key: 'cpa', label: 'CPA', sortable: true, formatter: formatCurrency, aggregate: (groupRows) => ratio(sumBy(groupRows, 'spend'), sumBy(groupRows, 'orders')) },
        { key: 'attribution_gap', label: 'Attribution Gap', sortable: true, formatter: formatCurrency },
    ];

    const attributionColumns = [
        { key: 'channel', label: 'Kanal', sortable: true },
        { key: 'platform_revenue', label: 'Platform Geliri', sortable: true, formatter: formatCurrency },
        { key: 'analytics_revenue', label: 'Analytics Geliri', sortable: true, formatter: formatCurrency },
        { key: 'ctr', label: 'CTR', sortable: true, formatter: formatPercent, aggregate: (groupRows) => ratio(sumBy(groupRows, 'clicks'), sumBy(groupRows, 'impressions'), 100) },
        { key: 'cvr', label: 'CVR', sortable: true, formatter: (value, row) => formatPercent(value ?? row.analytics_cvr), aggregate: (groupRows) => ratio(sumBy(groupRows, 'orders'), sumBy(groupRows, 'sessions'), 100) },
        { key: 'attribution_gap', label: 'Gap', sortable: true, formatter: formatCurrency },
        { key: 'diagnosis', label: 'Yorum', sortable: false }
    ];

    const productColumns = [
        { key: 'product_name', label: 'Ürün', sortable: true },
        { key: 'product_category', label: 'Kategori', sortable: true },
        { key: 'revenue', label: 'Ciro', sortable: true, formatter: formatCurrency },
        { key: 'orders', label: 'Sipariş', sortable: true },
        { key: 'items_sold', label: 'Adet', sortable: true },
        { key: 'aov', label: 'AOV', sortable: true, formatter: formatCurrency }
    ];

    const handleChannelClick = useCallback((channelLabel) => {
        const channelMap = { 'Meta Ads': 'meta', 'Google Ads': 'google_ads', Organic: 'organic', Direct: 'direct', Email: 'email', TikTok: 'tiktok' };
        const value = channelMap[channelLabel] || normalizeChannel(channelLabel);
        setFilter('channel', filters.channel === value ? '' : value);
    }, [filters.channel, setFilter]);

    if (error || attributionError) {
        return <div style={{ padding: '24px', color: 'var(--color-accent-danger)' }}>Pazarlama verisi yüklenirken hata oluştu.</div>;
    }

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Pazarlama Analizi</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Pazarlama harcaması, attribution farki, kampanya dagilimi ve ürün etkisini birlikte okuyun.
            </p>

            <FilterPanel />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Toplam Harcama" value={m.spend || 0} prefix="TL " change={compareEnabled ? calculateChange(m.spend || 0, prevAds.spend || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Platform ROAS" value={attributionSummary.platform_reported_roas || 0} suffix="x" change={compareEnabled ? calculateChange(attributionSummary.platform_reported_roas || 0, prevAttributionSummary.platform_reported_roas || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isAttributionLoading} />
                <KpiCard title="Analytics ROAS" value={attributionSummary.analytics_attributed_roas || 0} suffix="x" change={compareEnabled ? calculateChange(attributionSummary.analytics_attributed_roas || 0, prevAttributionSummary.analytics_attributed_roas || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isAttributionLoading} />
                <KpiCard title="Attribution Farki" value={attributionSummary.attribution_gap || 0} prefix="TL " change={compareEnabled ? calculateChange(attributionSummary.attribution_gap || 0, prevAttributionSummary.attribution_gap || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isAttributionLoading} />
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
                <BarChart
                    data={enrichedChannelRows.map((row) => ({ channel: row.channel, revenue: row.analytics_revenue || row.revenue || 0 }))}
                    isLoading={isLoading || isAttributionLoading}
                    onBarClick={handleChannelClick}
                    title="Analytics Ciroya Göre Kanal Özeti"
                />
                <InsightCard title="Pazarlama Okuması">
                    <div style={{ display: 'grid', gap: '10px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        <div>En yüksek Analytics ciro: <b style={{ color: 'var(--color-text-primary)' }}>{topChannel?.channel || '-'}</b></div>
                        <div>En büyük attribution farki: <b style={{ color: 'var(--color-text-primary)' }}>{riskiestChannel?.channel || '-'}</b></div>
                        <div>Detaylı kanal karşılaştırması için Kanal Analizi sayfasini kullanin.</div>
                    </div>
                </InsightCard>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <ScatterChart data={campaignData} isLoading={isCampaignLoading} title="Kampanya ROAS vs Harcama Dağılımı" />
            </div>

            <DataTable title="Attribution ve Kanal Teşhisi" columns={attributionColumns} data={attributionRows} exportFileName="attribution-analizi.csv" rowsPerPage={6} isLoading={isAttributionLoading} enableGrouping groupByOptions={['channel']} />

            <div style={{ height: '24px' }} />

            <DataTable title="Ürün Performansi" columns={productColumns} data={productData} exportFileName="ürün-performansi.csv" rowsPerPage={6} isLoading={isProductLoading} enableGrouping groupByOptions={['product_category', 'channel']} />

            <div style={{ height: '24px' }} />

            <DataTable title="Pazarlama Kanal Özeti" columns={channelColumns} data={enrichedChannelRows} exportFileName="pazarlama-kanal-ozeti.csv" rowsPerPage={6} isLoading={isLoading || isAttributionLoading} enableGrouping groupByOptions={['channel']} />

            {(isProductLoading || isAttributionLoading) && (
                <p style={{ color: 'var(--color-text-muted)', marginTop: '16px' }}>
                    Ek analizler yükleniyor...
                </p>
            )}
        </div>
    );
}


