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
    const queryString = new URLSearchParams(filters).toString();

    const { data: summaryData, isLoading } = useQuery({
        queryKey: ['kpi-summary', queryString],
        queryFn: async () => {
            const res = await api.get(`/kpi/summary?${queryString}`);
            return res.data.data;
        }
    });

    const s = summaryData?.sales || {};
    const cityData = summaryData?.breakdowns?.sales_by_city || [];
    const donutData = cityData.slice(0, 5).map((city) => ({
        platform: city.city,
        sessions: city.revenue
    }));

    const columns = [
        { key: 'city', label: 'Sehir', sortable: true },
        { key: 'orders', label: 'Siparis Sayisi', sortable: true, formatter: (v) => v.toLocaleString('tr-TR') },
        { key: 'revenue', label: 'Net Ciro (TL)', sortable: true, formatter: (v) => `TL${v.toLocaleString('tr-TR')}` },
        { key: 'refund_rate', label: 'Iade Orani (%)', sortable: true, formatter: (v) => `%${v.toFixed(1)}` },
    ];

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Satis ve Cografi Analiz</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Bolgelere gore satis performansini, iade oranlarini ve sepet ortalamalarini inceleyin.
            </p>

            <FilterPanel />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Toplam Ciro" value={s.revenue || 0} prefix="TL" isLoading={isLoading} />
                <KpiCard title="Toplam Siparis" value={s.orders || 0} isLoading={isLoading} />
                <KpiCard title="Sepet Ortalamasi (AOV)" value={s.aov || 0} prefix="TL" isLoading={isLoading} />
                <KpiCard title="Iade Tutari" value={s.refund_amount || 0} prefix="TL" isLoading={isLoading} />
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                <DonutChart data={donutData} isLoading={isLoading} />
            </div>

            <DataTable
                title="Sehir Bazli Satis Performansi"
                columns={columns}
                data={cityData}
                exportFileName="sehir_satis_performans.csv"
                rowsPerPage={5}
            />
        </div>
    );
}
