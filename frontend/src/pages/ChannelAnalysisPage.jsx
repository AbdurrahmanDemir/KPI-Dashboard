import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
import KpiCard from '../components/ui/KpiCard';

export default function ChannelAnalysisPage() {
    const { filters, setFilter } = useFilterStore();
    const queryString = new URLSearchParams(filters).toString();

    const { data, isLoading, error } = useQuery({
        queryKey: ['channel-performance', queryString],
        queryFn: async () => (await api.get(`/dashboard/channel-performance?${queryString}`)).data.data || []
    });

    const rows = data || [];

    const totalRevenue = rows.reduce((sum, r) => sum + (r.revenue || 0), 0);
    const topChannel = rows[0];

    const donutData = rows.map(r => ({ platform: r.channel, sessions: r.revenue }));

    // Cross-filter: kanal seçimine tıklayınca global filtre güncellenir
    const handleChannelClick = (channelLabel) => {
        const channelMap = {
            'Meta Ads': 'meta',
            'Google Ads': 'google_ads',
            'Organic': 'organic',
            'Direct': 'direct',
            'Email': 'email',
            'TikTok': 'tiktok',
        };
        const val = channelMap[channelLabel] || channelLabel.toLowerCase();
        setFilter('channel', filters.channel === val ? '' : val);
    };

    const columns = [
        { key: 'channel', label: 'Kanal', sortable: true },
        { key: 'revenue', label: 'Ciro (₺)', sortable: true, formatter: (v) => `₺${Number(v).toLocaleString('tr-TR')}` },
        {
            key: 'share', label: 'Pay (%)', sortable: false,
            formatter: (v, row) => totalRevenue > 0 ? `%${((row.revenue / totalRevenue) * 100).toFixed(1)}` : '—'
        }
    ];

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
                Kanal bazlı ciro performansını karşılaştırın. Grafiğe tıklayarak cross-filter uygulayabilirsiniz.
            </p>

            <FilterPanel />

            {/* Özet KPI Kartları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Toplam Ciro" value={totalRevenue} prefix="₺" isLoading={isLoading} />
                <KpiCard title="Aktif Kanal Sayısı" value={rows.length} isLoading={isLoading} />
                <KpiCard title="En İyi Kanal Ciro" value={topChannel?.revenue || 0} prefix="₺" isLoading={isLoading} subtitle={topChannel?.channel || '—'} />
                <KpiCard
                    title="En İyi Kanal Payı"
                    value={totalRevenue > 0 && topChannel ? ((topChannel.revenue / totalRevenue) * 100).toFixed(1) : 0}
                    suffix="%"
                    isLoading={isLoading}
                />
            </div>

            {/* Grafikler */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '24px', marginBottom: '24px' }}>
                <BarChart data={rows} isLoading={isLoading} onBarClick={handleChannelClick} />
                <DonutChart data={donutData} isLoading={isLoading} />
            </div>

            {/* Detay Tablosu */}
            <DataTable
                title="Kanal Bazlı Performans"
                columns={columns}
                data={rows}
                exportFileName="kanal_performansi.csv"
                rowsPerPage={8}
            />
        </div>
    );
}
