import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import KpiCard from '../components/ui/KpiCard';
import TrendChart from '../components/charts/TrendChart';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';

const DEFAULT_CARD_ORDER = ['revenue', 'orders', 'cvr', 'roas', 'ad_spend', 'cpc', 'sessions', 'refund_rate'];

export default function DashboardPage() {
    const { filters, setFilter } = useFilterStore();
    const queryString = new URLSearchParams(filters).toString();
    const [cardOrder, setCardOrder] = useState(DEFAULT_CARD_ORDER);

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
                layout_config: { card_order: cardOrder, version: 1 },
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

    // Drag-drop yeniden sıralama
    const onDragEnd = (result) => {
        if (!result.destination) return;
        const newOrder = Array.from(cardOrder);
        const [moved] = newOrder.splice(result.source.index, 1);
        newOrder.splice(result.destination.index, 0, moved);
        setCardOrder(newOrder);
    };

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
    const channelPerformance = summaryData?.breakdowns?.channel_performance || [];
    const platformDistribution = summaryData?.breakdowns?.platform_distribution || [];

    const CARDS = {
        revenue:    { title: 'Toplam Ciro',          value: s.revenue || 0,      prefix: '₺' },
        orders:     { title: 'Toplam Sipariş',        value: s.orders || 0,       prefix: '' },
        cvr:        { title: 'Satış CVR',             value: t.cvr || 0,          suffix: '%' },
        roas:       { title: 'ROAS (Analytics)',      value: a.roas || 0,         suffix: 'x' },
        ad_spend:   { title: 'Reklam Harcaması',      value: a.spend || 0,        prefix: '₺' },
        cpc:        { title: 'Tıklama Maliyeti (CPC)',value: a.cpc || 0,          prefix: '₺' },
        sessions:   { title: 'Toplam Ziyaretçi',      value: t.sessions || 0,     prefix: '' },
        refund_rate:{ title: 'İade Oranı',            value: s.refund_rate || 0,  suffix: '%' },
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            {/* Başlık */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Genel Bakış Dashboard</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        Ciro, trafik ve reklam performansınızı tek bir ekranda analiz edin.
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

            {/* Drag-drop KPI Kartları */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="kpi-cards" direction="horizontal">
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                                gap: '20px',
                                marginBottom: '24px'
                            }}
                        >
                            {cardOrder.map((cardKey, index) => {
                                const card = CARDS[cardKey];
                                if (!card) return null;
                                return (
                                    <Draggable key={cardKey} draggableId={cardKey} index={index}>
                                        {(dragProvided, snapshot) => (
                                            <div
                                                ref={dragProvided.innerRef}
                                                {...dragProvided.draggableProps}
                                                {...dragProvided.dragHandleProps}
                                                style={{
                                                    ...dragProvided.draggableProps.style,
                                                    opacity: snapshot.isDragging ? 0.85 : 1,
                                                    transform: snapshot.isDragging
                                                        ? dragProvided.draggableProps.style?.transform
                                                        : undefined,
                                                    cursor: 'grab',
                                                }}
                                                title="Sürükleyerek yeniden sıralayın"
                                            >
                                                <KpiCard
                                                    title={card.title}
                                                    value={card.value}
                                                    prefix={card.prefix}
                                                    suffix={card.suffix}
                                                    isLoading={isSummaryLoading}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Grafikler */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <TrendChart data={trendData} isLoading={isTrendLoading} />
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <BarChart
                        isLoading={isSummaryLoading}
                        data={channelPerformance}
                        onBarClick={handleChannelClick}
                        title="Kanal Bazlı Ciro (Tıkla → Filtrele)"
                    />
                    <DonutChart
                        isLoading={isSummaryLoading}
                        data={platformDistribution}
                    />
                </div>
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
