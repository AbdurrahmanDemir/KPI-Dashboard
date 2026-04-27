import React, { useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import KpiCard from '../components/ui/KpiCard';
import TrendChart from '../components/charts/TrendChart';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
import {
    buildComparisonFilters,
    buildQueryString,
    calculateChange,
    getComparisonLabel
} from '../utils/filterComparison';

const OVERVIEW_CARD_KEYS = ['users', 'sessions', 'engagement_rate', 'conversions', 'revenue'];

const formatCompact = (value) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value || 0);

export default function DashboardPage() {
    const { filters, setFilter } = useFilterStore();
    const queryString = buildQueryString(filters);
    const comparisonFilters = buildComparisonFilters(filters);
    const comparisonQueryString = comparisonFilters ? buildQueryString(comparisonFilters) : '';
    const comparisonLabel = filters.compare_previous_period
        ? `onceki donem (${getComparisonLabel(filters)})`
        : 'onceki donem';

    // Query 1: Özet KPI'lar
    const { data: summaryData, isLoading: isSummaryLoading, error: summaryError } = useQuery({
        queryKey: ['kpi-summary', queryString],
        queryFn: async () => {
            const res = await api.get(`/kpi/summary?${queryString}`);
            return res.data.data;
        }
    });

    // Query 2: Trend Verisi
    const { data: trendData, isLoading: isTrendLoading } = useQuery({
        queryKey: ['kpi-trend', queryString],
        queryFn: async () => {
            const res = await api.get(`/kpi/trend?${queryString}`);
            return res.data.data;
        }
    });

    const { data: comparisonSummaryData } = useQuery({
        enabled: Boolean(comparisonFilters),
        queryKey: ['kpi-summary-comparison', comparisonQueryString],
        queryFn: async () => {
            const res = await api.get(`/kpi/summary?${comparisonQueryString}`);
            return res.data.data;
        }
    });

    // Görünümü Kaydet
    const saveViewMutation = useMutation({
        mutationFn: async () => {
            await api.post('/views', {
                name: `Görünüm - ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`,
                layout_config: { card_order: OVERVIEW_CARD_KEYS, version: 2, profile: 'ga-inspired-overview' },
                filter_config: filters
            });
        },
        onSuccess: () => alert('Görünüm başarıyla kaydedildi!')
    });

    // Cross-filter: kanal bar tıklaması
    const handleChannelClick = useCallback((channelLabel) => {
        const channelMap = { 'Meta Ads': 'meta', 'Google Ads': 'google_ads', 'Organic': 'organic', 'Direct': 'direct', 'Email': 'email', 'TikTok': 'tiktok' };
        const val = channelMap[channelLabel] || channelLabel.toLowerCase();
        setFilter('channel', filters.channel === val ? '' : val);
    }, [filters.channel, setFilter]);

    if (summaryError) {
        return (
            <div style={{ padding: 24, color: 'var(--color-accent-danger)', background: 'var(--color-bg-secondary)', borderRadius: 12, margin: 24 }}>
                ⚠️ Veriler yüklenirken hata oluştu: {summaryError.message}
            </div>
        );
    }

    const s = summaryData?.sales || {};
    const t = summaryData?.traffic || {};
    const a = summaryData?.ads || {};
    const prevSales = comparisonSummaryData?.sales || {};
    const prevTraffic = comparisonSummaryData?.traffic || {};
    const channelPerformance = summaryData?.breakdowns?.channel_performance || [];
    const platformDistribution = summaryData?.breakdowns?.platform_distribution || [];
    const compareEnabled = Boolean(comparisonFilters);

    const CARDS = {
        users: {
            title: 'Aktif Kullanıcılar',
            value: t.users || 0,
            subtitle: `${formatCompact(t.new_users)} yeni kullanıcı`,
            change: compareEnabled ? calculateChange(t.users || 0, prevTraffic.users || 0) : undefined
        },
        sessions: {
            title: 'Oturumlar',
            value: t.sessions || 0,
            subtitle: `${formatCompact(a.clicks)} reklam tıklaması`,
            change: compareEnabled ? calculateChange(t.sessions || 0, prevTraffic.sessions || 0) : undefined
        },
        engagement_rate: {
            title: 'Etkileşim Oranı',
            value: Math.max(0, 100 - (t.bounce_rate || 0)),
            suffix: '%',
            subtitle: `Hemen çıkma: ${(t.bounce_rate || 0).toFixed(2)}%`,
            change: compareEnabled
                ? calculateChange(
                    Math.max(0, 100 - (t.bounce_rate || 0)),
                    Math.max(0, 100 - (prevTraffic.bounce_rate || 0))
                )
                : undefined
        },
        conversions: {
            title: 'Dönüşümler',
            value: t.conversions || 0,
            subtitle: `CVR: ${(t.cvr || 0).toFixed(2)}%`,
            change: compareEnabled ? calculateChange(t.conversions || 0, prevTraffic.conversions || 0) : undefined
        },
        revenue: {
            title: 'Toplam Gelir',
            value: s.revenue || 0,
            prefix: '₺',
            subtitle: `${formatCompact(s.orders)} sipariş`,
            change: compareEnabled ? calculateChange(s.revenue || 0, prevSales.revenue || 0) : undefined
        }
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            {/* Başlık */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Genel Bakış Dashboard</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        Google Analytics yaklaşımına yakın sade görünüm: Acquisition, Engagement ve Monetization.
                    </p>
                </div>
                <button
                    onClick={() => saveViewMutation.mutate()}
                    disabled={saveViewMutation.isPending}
                    style={{
                        padding: '10px 16px',
                        background: 'rgba(99,102,241,0.1)',
                        color: 'var(--color-accent-primary)',
                        border: '1px solid var(--color-accent-primary)',
                        borderRadius: '6px',
                        cursor: saveViewMutation.isPending ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: saveViewMutation.isPending ? 0.6 : 1
                    }}
                >
                    💾 {saveViewMutation.isPending ? 'Kaydediliyor...' : 'Görünümü Kaydet'}
                </button>
            </div>

            <FilterPanel />

            <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Çekirdek metrikler: Kullanıcı, Oturum, Etkileşim, Dönüşüm, Gelir
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '20px',
                    marginBottom: '24px'
                }}
            >
                {OVERVIEW_CARD_KEYS.map((cardKey) => {
                    const card = CARDS[cardKey];
                    if (!card) return null;
                    return (
                        <KpiCard
                            key={cardKey}
                            title={card.title}
                            value={card.value}
                            prefix={card.prefix}
                            suffix={card.suffix}
                            change={card.change}
                            comparisonLabel={comparisonLabel}
                            subtitle={card.subtitle}
                            isLoading={isSummaryLoading}
                        />
                    );
                })}
            </div>

            {/* Grafikler */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    <TrendChart
                        data={trendData}
                        isLoading={isTrendLoading}
                        title="Monetization Trendi (Gelir ve Sipariş)"
                    />
                    <DonutChart
                        isLoading={isSummaryLoading}
                        data={platformDistribution}
                        title="Acquisition Dağılımı (Oturumlar)"
                    />
                </div>
                <BarChart
                    isLoading={isSummaryLoading}
                    data={channelPerformance}
                    onBarClick={handleChannelClick}
                    title="Kanal Bazlı Gelir (Acquisition → Revenue)"
                />
            </div>

            {/* Aktif filtre bildirimi */}
            {filters.channel && (
                <div style={{
                    marginTop: '16px', padding: '10px 16px', borderRadius: '8px',
                    background: 'rgba(99,102,241,0.1)', border: '1px solid var(--color-accent-primary)',
                    fontSize: '13px', color: 'var(--color-accent-primary)', display: 'flex', justifyContent: 'space-between'
                }}>
                    <span>🔍 Aktif Cross-Filter: <b>{filters.channel}</b></span>
                    <button onClick={() => setFilter('channel', '')} style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', cursor: 'pointer', fontWeight: 600 }}>
                        × Temizle
                    </button>
                </div>
            )}
        </div>
    );
}
