import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import ScatterChart from '../components/charts/ScatterChart';
import KpiCard from '../components/ui/KpiCard';

export default function CampaignAnalysisPage() {
    const { filters } = useFilterStore();
    const queryString = new URLSearchParams(filters).toString();

    const { data, isLoading, error } = useQuery({
        queryKey: ['campaign-performance', queryString],
        queryFn: async () => (await api.get(`/dashboard/campaign-performance?${queryString}`)).data.data || []
    });

    const rows = data || [];

    // Özet hesaplamalar
    const totalSpend = rows.reduce((sum, r) => sum + (r.spend || 0), 0);
    const totalRevenue = rows.reduce((sum, r) => sum + (r.analytics_revenue || 0), 0);
    const totalConversions = rows.reduce((sum, r) => sum + (r.conversions || 0), 0);
    const avgRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : 0;

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
                <KpiCard title="Toplam Harcama" value={totalSpend} prefix="₺" isLoading={isLoading} />
                <KpiCard title="Analytics Ciro" value={totalRevenue} prefix="₺" isLoading={isLoading} />
                <KpiCard title="Ortalama ROAS" value={Number(avgRoas)} suffix="x" isLoading={isLoading} />
                <KpiCard title="Toplam Dönüşüm" value={totalConversions} isLoading={isLoading} />
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
            />
        </div>
    );
}
