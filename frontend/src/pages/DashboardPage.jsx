import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import KpiCard from '../components/ui/KpiCard';
import TrendChart from '../components/charts/TrendChart';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';

export default function DashboardPage() {
    const { filters } = useFilterStore();
    const queryString = new URLSearchParams(filters).toString();

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

    // Görünümü Kaydet
    const saveViewMutation = useMutation({
        mutationFn: async () => {
            await api.post('/views', {
                name: `Görünüm - ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`,
                layout_config: { dashboard: 'default', cards: 8 },
                filter_config: filters
            });
        },
        onSuccess: () => alert('Görünüm (Şablon) başarıyla kaydedildi!')
    });

    if (summaryError) {
        return <div style={{ padding: 24, color: 'red' }}>Veriler yüklenirken hata oluştu: {summaryError.message}</div>;
    }

    const s = summaryData?.sales || {};
    const t = summaryData?.traffic || {};
    const a = summaryData?.ads || {};
    const channelPerformance = summaryData?.breakdowns?.channel_performance || [];
    const platformDistribution = summaryData?.breakdowns?.platform_distribution || [];

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Genel Bakış Dashboard</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        Ciro, trafik ve reklam performansınızı tek bir ekranda analiz edin.
                    </p>
                </div>
                <button 
                    onClick={saveViewMutation.mutate}
                    disabled={saveViewMutation.isLoading}
                    style={{
                        padding: '10px 16px',
                        background: 'rgba(99,102,241,0.1)',
                        color: 'var(--color-accent-primary)',
                        border: '1px solid var(--color-accent-primary)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    💾 Görünümü Kaydet
                </button>
            </div>

            <FilterPanel />

            {/* 8 KPI Kartı Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard 
                    title="Toplam Ciro" 
                    value={s.revenue || 0} 
                    prefix="₺" 
                    isLoading={isSummaryLoading} 
                />
                <KpiCard 
                    title="Toplam Sipariş" 
                    value={s.orders || 0} 
                    isLoading={isSummaryLoading} 
                />
                <KpiCard 
                    title="Satış Dönüşüm Oranı (CVR)" 
                    value={t.cvr || 0} 
                    suffix="%" 
                    isLoading={isSummaryLoading} 
                />
                <KpiCard 
                    title="Maliyet / Ciro (ROAS)" 
                    value={a.roas || 0} 
                    prefix="" 
                    isLoading={isSummaryLoading} 
                />
                <KpiCard 
                    title="Reklam Harcaması" 
                    value={a.spend || 0} 
                    prefix="₺" 
                    isLoading={isSummaryLoading} 
                />
                <KpiCard 
                    title="Tıklama Maliyeti (CPC)" 
                    value={a.cpc || 0} 
                    prefix="₺" 
                    isLoading={isSummaryLoading} 
                />
                <KpiCard 
                    title="Toplam Ziyaretçi" 
                    value={t.sessions || 0} 
                    isLoading={isSummaryLoading} 
                />
                <KpiCard 
                    title="Siparişte İade Oranı" 
                    value={s.refund_rate || 0} 
                    suffix="%" 
                    isLoading={isSummaryLoading} 
                />
            </div>

            {/* Grafikler Alanı */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <TrendChart data={trendData} isLoading={isTrendLoading} />
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <BarChart 
                        isLoading={isSummaryLoading}
                        data={channelPerformance} 
                    />
                    <DonutChart 
                        isLoading={isSummaryLoading}
                        data={platformDistribution} 
                    />
                </div>
            </div>
        </div>
    );
}
