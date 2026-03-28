import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import BarChart from '../components/charts/BarChart';
import KpiCard from '../components/ui/KpiCard';
import api from '../services/api';

const sectionCard = {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '20px'
};

export default function MarketingAnalysisPage() {
    const { filters } = useFilterStore();
    const queryString = new URLSearchParams(filters).toString();

    const { data: summaryData, isLoading } = useQuery({
        queryKey: ['kpi-summary', queryString],
        queryFn: async () => {
            const res = await api.get(`/kpi/summary?${queryString}`);
            return res.data.data;
        }
    });

    const { data: attributionData, isLoading: isAttributionLoading } = useQuery({
        queryKey: ['attribution-analysis', queryString],
        queryFn: async () => {
            const res = await api.get(`/dashboard/attribution-analysis?${queryString}`);
            return res.data.data;
        }
    });

    const { data: productData, isLoading: isProductLoading } = useQuery({
        queryKey: ['product-performance', queryString],
        queryFn: async () => {
            const res = await api.get(`/dashboard/product-performance?${queryString}`);
            return res.data.data || [];
        }
    });

    const m = summaryData?.ads || {};
    const channelData = summaryData?.breakdowns?.marketing_channels || [];
    const attributionSummary = attributionData?.summary || summaryData?.attribution?.summary || {};
    const attributionRows = attributionData?.rows || summaryData?.attribution?.rows || [];

    const channelColumns = [
        { key: 'channel', label: 'Kanal / Platform', sortable: true },
        { key: 'spend', label: 'Harcama (TL)', sortable: true, formatter: (v) => `TL${Number(v || 0).toLocaleString('tr-TR')}` },
        { key: 'ctr', label: 'CTR (%)', sortable: true, formatter: (v) => `%${Number(v || 0).toFixed(2)}` },
        { key: 'analytics_revenue', label: 'Analytics Ciro', sortable: true, formatter: (v) => `TL${Number(v || 0).toLocaleString('tr-TR')}` },
        { key: 'platform_roas', label: 'Platform ROAS', sortable: true, formatter: (v) => `${Number(v || 0).toFixed(2)}x` },
        { key: 'roas', label: 'Analytics ROAS', sortable: true, formatter: (v) => `${Number(v || 0).toFixed(2)}x` }
    ];

    const attributionColumns = [
        { key: 'channel', label: 'Kanal', sortable: true },
        { key: 'platform_revenue', label: 'Platform Geliri', sortable: true, formatter: (v) => `TL${Number(v || 0).toLocaleString('tr-TR')}` },
        { key: 'analytics_revenue', label: 'Analytics Geliri', sortable: true, formatter: (v) => `TL${Number(v || 0).toLocaleString('tr-TR')}` },
        { key: 'ctr', label: 'CTR', sortable: true, formatter: (v) => `%${Number(v || 0).toFixed(2)}` },
        { key: 'cvr', label: 'CVR', sortable: true, formatter: (v) => `%${Number(v || 0).toFixed(2)}` },
        { key: 'attribution_gap', label: 'Gap', sortable: true, formatter: (v) => `TL${Number(v || 0).toLocaleString('tr-TR')}` },
        { key: 'diagnosis', label: 'Yorum', sortable: false }
    ];

    const productColumns = [
        { key: 'product_name', label: 'Urun', sortable: true },
        { key: 'product_category', label: 'Kategori', sortable: true },
        { key: 'revenue', label: 'Ciro', sortable: true, formatter: (v) => `TL${Number(v || 0).toLocaleString('tr-TR')}` },
        { key: 'orders', label: 'Siparis', sortable: true },
        { key: 'items_sold', label: 'Adet', sortable: true },
        { key: 'aov', label: 'AOV', sortable: true, formatter: (v) => `TL${Number(v || 0).toLocaleString('tr-TR')}` }
    ];

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Pazarlama Analizi</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Google ve Meta verilerini ayni ekranda gorun, ama satis kaynagini Google Analytics attribution verisiyle okuyun.
            </p>

            <FilterPanel />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Toplam Harcama" value={m.spend || 0} prefix="TL" isLoading={isLoading} />
                <KpiCard title="Platform ROAS" value={attributionSummary.platform_reported_roas || 0} suffix="x" isLoading={isAttributionLoading} />
                <KpiCard title="Analytics ROAS" value={attributionSummary.analytics_attributed_roas || 0} suffix="x" isLoading={isAttributionLoading} />
                <KpiCard title="Attribution Farki" value={attributionSummary.attribution_gap || 0} prefix="TL" isLoading={isAttributionLoading} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '24px' }}>
                <BarChart data={channelData.map((row) => ({ channel: row.channel, revenue: row.analytics_revenue || row.revenue || 0 }))} isLoading={isLoading} />
                <div style={sectionCard}>
                    <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>Toplanti Notlarina Gore Okuma</h3>
                    <div style={{ display: 'grid', gap: '10px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        <div>Satisa kim katkida bulundu sorusunda referans metrik Analytics geliridir.</div>
                        <div>Platform ROAS ile Analytics ROAS arasindaki fark buyurse attribution sisirmesi olabilir.</div>
                        <div>Dusuk performansi anlamak icin CTR, CVR ve urun bazli ciro ayni anda incelenir.</div>
                    </div>
                </div>
            </div>

            <DataTable
                title="Attribution ve Kanal Teshisi"
                columns={attributionColumns}
                data={attributionRows}
                exportFileName="attribution-analizi.csv"
                rowsPerPage={6}
            />

            <div style={{ height: '24px' }} />

            <DataTable
                title="Urun Performansi"
                columns={productColumns}
                data={productData}
                exportFileName="urun-performansi.csv"
                rowsPerPage={6}
            />

            <div style={{ height: '24px' }} />

            <DataTable
                title="Kanal Performansi Detayli Tablo"
                columns={channelColumns}
                data={channelData}
                exportFileName="kanal-performans.csv"
                rowsPerPage={6}
            />

            {(isProductLoading || isAttributionLoading) && (
                <p style={{ color: 'var(--color-text-muted)', marginTop: '16px' }}>
                    Ek analizler yukleniyor...
                </p>
            )}
        </div>
    );
}
