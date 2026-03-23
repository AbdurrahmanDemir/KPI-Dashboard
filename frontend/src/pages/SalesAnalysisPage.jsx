import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import DonutChart from '../components/charts/DonutChart';
import KpiCard from '../components/ui/KpiCard';
import api from '../services/api';

export default function SalesAnalysisPage() {
    const { filters } = useFilterStore();
    
    // Geçici olarak mock veri kullanımı
    const { data: summaryData, isLoading } = useQuery({
        queryKey: ['kpi-summary', filters],
        queryFn: async () => {
            const params = new URLSearchParams(filters).toString();
            const res = await api.get(`/kpi/summary?${params}`);
            return res.data.data;
        }
    });

    const s = summaryData?.sales || {};

    const mockCityData = [
        { id: 1, city: 'İstanbul', orders: 1540, revenue: 1250000, refund_rate: 4.2 },
        { id: 2, city: 'Ankara', orders: 840, revenue: 680000, refund_rate: 3.1 },
        { id: 3, city: 'İzmir', orders: 620, revenue: 540000, refund_rate: 4.8 },
        { id: 4, city: 'Bursa', orders: 410, revenue: 320000, refund_rate: 2.5 },
        { id: 5, city: 'Antalya', orders: 380, revenue: 305000, refund_rate: 5.4 },
        { id: 6, city: 'Adana', orders: 250, revenue: 195000, refund_rate: 3.8 },
        { id: 7, city: 'Konya', orders: 210, revenue: 155000, refund_rate: 2.1 },
    ];

    const columns = [
        { key: 'city', label: 'Şehir', sortable: true },
        { key: 'orders', label: 'Sipariş Sayısı', sortable: true, formatter: v => v.toLocaleString('tr-TR') },
        { key: 'revenue', label: 'Net Ciro (₺)', sortable: true, formatter: v => `₺${v.toLocaleString('tr-TR')}` },
        { key: 'refund_rate', label: 'İade Oranı (%)', sortable: true, formatter: v => `%${v.toFixed(1)}` },
    ];

    const donutData = mockCityData.slice(0, 5).map(c => ({
        platform: c.city,
        sessions: c.revenue // Donut chart için ciro verisi yolluyoruz
    }));

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Satış ve Coğrafik Analiz</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Bölgelere göre satış performansını, iade oranlarını ve sepet ortalamalarını inceleyin.
            </p>

            <FilterPanel />

            {/* Özet Kartlar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Toplam Ciro" value={s.revenue || 0} prefix="₺" change={5.4} isLoading={isLoading} />
                <KpiCard title="Toplam Sipariş" value={s.orders || 0} change={3.2} isLoading={isLoading} />
                <KpiCard title="Sepet Ortalaması (AOV)" value={s.aov || 0} prefix="₺" change={1.2} isLoading={isLoading} />
                <KpiCard title="İade Tutarı" value={s.refund_amount || 0} prefix="₺" change={-0.5} isLoading={isLoading} />
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                <DonutChart data={donutData} isLoading={false} />
            </div>

            {/* DataTable */}
            <DataTable 
                title="Şehir Bazlı Satış Performansı"
                columns={columns}
                data={mockCityData}
                exportFileName="sehir_satis_performans.csv"
                rowsPerPage={5}
            />
        </div>
    );
}
