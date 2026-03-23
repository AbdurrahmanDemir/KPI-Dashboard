import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import BarChart from '../components/charts/BarChart';
import KpiCard from '../components/ui/KpiCard';
import api from '../services/api';

export default function MarketingAnalysisPage() {
    const { filters } = useFilterStore();
    
    // Geçici olarak mock veri veya kpi-summary çağıralım
    const { data: summaryData, isLoading } = useQuery({
        queryKey: ['kpi-summary', filters],
        queryFn: async () => {
            const params = new URLSearchParams(filters).toString();
            const res = await api.get(`/kpi/summary?${params}`);
            return res.data.data;
        }
    });

    const m = summaryData?.ads || {};

    const mockChannelData = [
        { id: 1, channel: 'Meta Ads', spend: 12500, impressions: 450000, clicks: 12000, ctr: 2.66, revenue: 45000, roas: 3.6 },
        { id: 2, channel: 'Google Ads', spend: 8500, impressions: 120000, clicks: 8500, ctr: 7.08, revenue: 68000, roas: 8.0 },
        { id: 3, channel: 'TikTok Ads', spend: 4000, impressions: 380000, clicks: 5400, ctr: 1.42, revenue: 9500, roas: 2.37 },
        { id: 4, channel: 'Organic Search', spend: 0, impressions: 85000, clicks: 3500, ctr: 4.11, revenue: 25000, roas: 0 },
        { id: 5, channel: 'Email/CRM', spend: 500, impressions: 15000, clicks: 2200, ctr: 14.66, revenue: 18500, roas: 37.0 },
    ];

    const columns = [
        { key: 'channel', label: 'Kanal / Platform', sortable: true },
        { key: 'spend', label: 'Harcama (₺)', sortable: true, formatter: v => `₺${v.toLocaleString('tr-TR')}` },
        { key: 'impressions', label: 'Gösterim', sortable: true, formatter: v => v.toLocaleString('tr-TR') },
        { key: 'clicks', label: 'Tıklama', sortable: true, formatter: v => v.toLocaleString('tr-TR') },
        { key: 'ctr', label: 'TO / CTR (%)', sortable: true, formatter: v => `%${v.toFixed(2)}` },
        { key: 'revenue', label: 'Ciro (₺)', sortable: true, formatter: v => `₺${v.toLocaleString('tr-TR')}` },
        { key: 'roas', label: 'ROAS', sortable: true, formatter: v => v > 0 ? `${v.toFixed(2)}x` : '-' },
    ];

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Pazarlama Analizi</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Kanallara ve kampanyalara göre pazarlama bütçesi getirisini (ROAS) inceleyin.
            </p>

            <FilterPanel />

            {/* Özet Kartlar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Toplam Harcama" value={m.spend || 0} prefix="₺" change={2.4} isLoading={isLoading} />
                <KpiCard title="Genel ROAS" value={m.roas || 0} suffix="x" change={-1.2} isLoading={isLoading} />
                <KpiCard title="Toplam Tıklama" value={m.clicks || 0} change={8.5} isLoading={isLoading} />
                <KpiCard title="Ortalama Tıklama Başına Maliyet (CPC)" value={m.cpc || 0} prefix="₺" change={4.1} isLoading={isLoading} />
            </div>

            {/* Grafikler Alanı */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                <BarChart data={mockChannelData} isLoading={false} />
            </div>

            {/* DataTable */}
            <DataTable 
                title="Kanal Performansı Detaylı Tablo"
                columns={columns}
                data={mockChannelData}
                exportFileName="kanal_performans.csv"
                rowsPerPage={5}
            />
        </div>
    );
}
