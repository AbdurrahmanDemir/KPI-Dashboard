import React, { useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { useQuery } from '@tanstack/react-query';
import useFilterStore from '../store/filterStore';
import FilterPanel from '../components/ui/FilterPanel';
import DataTable from '../components/ui/DataTable';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import KpiCard from '../components/ui/KpiCard';
import api from '../services/api';
import {
    buildComparisonFilters,
    buildQueryString,
    calculateChange,
    getComparisonLabel
} from '../utils/filterComparison';

const formatCurrency = (value) => `TL ${Number(value || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
const formatNumber = (value) => Number(value || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
const formatPercent = (value) => `%${Number(value || 0).toFixed(2)}`;

const dimensionOptions = [
    { value: 'product', label: 'Ürün' },
    { value: 'city', label: 'Şehir' },
    { value: 'device', label: 'Cihaz' },
    { value: 'payment_method', label: 'Ödeme Yöntemi' }
];

const comparisonSectionStyle = {
    background: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px'
};

const cardStyle = {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '20px'
};

function ChartCard({ title, subtitle, children }) {
    return (
        <div style={cardStyle}>
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{title}</h3>
                {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

function MetricDelta({ a, b, type }) {
    const diff = Number(a || 0) - Number(b || 0);
    const color = diff > 0 ? 'var(--color-accent-success)' : diff < 0 ? 'var(--color-accent-danger)' : 'var(--color-text-muted)';
    const value = type === 'currency' ? formatCurrency(diff) : type === 'percent' ? `${diff > 0 ? '+' : ''}${formatNumber(diff)} puan` : `${diff > 0 ? '+' : ''}${formatNumber(diff)}`;

    return <span style={{ color, fontWeight: 700 }}>{value}</span>;
}

export default function SalesAnalysisPage() {
    const { filters } = useFilterStore();
    const [dimension, setDimension] = useState('product');
    const [selectedA, setSelectedA] = useState('');
    const [selectedB, setSelectedB] = useState('');
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

    const { data: comparisonSummaryData } = useQuery({
        enabled: Boolean(comparisonFilters),
        queryKey: ['sales-summary-comparison', comparisonQueryString],
        queryFn: async () => {
            const res = await api.get(`/kpi/summary?${comparisonQueryString}`);
            return res.data.data;
        }
    });

    const dimensionQuery = queryString ? `${queryString}&dimension=${dimension}` : `dimension=${dimension}`;
    const { data: dimensionRows = [], isLoading: isDimensionLoading } = useQuery({
        queryKey: ['sales-dimension-performance', dimension, queryString],
        queryFn: async () => {
            const res = await api.get(`/dashboard/sales-dimension-performance?${dimensionQuery}`);
            return res.data.data || [];
        }
    });

    const s = summaryData?.sales || {};
    const prevSales = comparisonSummaryData?.sales || {};
    const cityData = summaryData?.breakdowns?.sales_by_city || [];
    const adFormatDataRaw = summaryData?.breakdowns?.sales_by_ad_format || [];
    const compareEnabled = Boolean(comparisonFilters);

    const options = useMemo(() => dimensionRows.map((row) => row.name), [dimensionRows]);
    useEffect(() => {
        if (!options.length) return;
        setSelectedA((current) => options.includes(current) ? current : options[0]);
        setSelectedB((current) => options.includes(current) ? current : options[1] || options[0]);
    }, [options]);

    const itemA = dimensionRows.find((row) => row.name === selectedA);
    const itemB = dimensionRows.find((row) => row.name === selectedB);
    const selectedDimensionLabel = dimensionOptions.find((item) => item.value === dimension)?.label || 'Boyut';

    const comparisonRows = useMemo(() => {
        if (!itemA || !itemB) return [];
        return [
            { metric: 'Ciro', a: itemA.revenue, b: itemB.revenue, type: 'currency' },
            { metric: 'Sipariş', a: itemA.orders, b: itemB.orders },
            { metric: 'AOV', a: itemA.aov, b: itemB.aov, type: 'currency' },
            { metric: 'Satılan Adet', a: itemA.items_sold, b: itemB.items_sold },
            { metric: 'Adet / Sipariş', a: itemA.items_per_order, b: itemB.items_per_order },
            { metric: 'Müşteri Başına Ciro', a: itemA.revenue_per_customer, b: itemB.revenue_per_customer, type: 'currency' },
            { metric: 'Tekil Müşteri', a: itemA.unique_customers, b: itemB.unique_customers },
            { metric: 'İndirim Tutarı', a: itemA.discount_amount, b: itemB.discount_amount, type: 'currency' },
            { metric: 'İade Tutarı', a: itemA.refund_amount, b: itemB.refund_amount, type: 'currency' },
            { metric: 'İade Oranı', a: itemA.refund_rate, b: itemB.refund_rate, type: 'percent' }
        ];
    }, [itemA, itemB]);

    const topRows = useMemo(() => [...dimensionRows].sort((a, b) => b.revenue - a.revenue).slice(0, 10), [dimensionRows]);
    const riskyRows = useMemo(() => [...dimensionRows].sort((a, b) => b.refund_rate - a.refund_rate).slice(0, 8), [dimensionRows]);

    const donutData = cityData.slice(0, 5).map((city) => ({
        platform: city.city,
        sessions: city.revenue
    }));
    const adFormatData = adFormatDataRaw.map((item) => ({
        channel: item.format,
        revenue: item.revenue
    }));

    const comparisonColumns = [
        { key: 'metric', label: 'Metrik', sortable: true },
        { key: 'a', label: itemA?.name || 'Seçim A', sortable: true, formatter: (value, row) => row.type === 'currency' ? formatCurrency(value) : row.type === 'percent' ? formatPercent(value) : formatNumber(value) },
        { key: 'b', label: itemB?.name || 'Seçim B', sortable: true, formatter: (value, row) => row.type === 'currency' ? formatCurrency(value) : row.type === 'percent' ? formatPercent(value) : formatNumber(value) },
        { key: 'delta', label: 'Fark', sortable: false, formatter: (_, row) => <MetricDelta a={row.a} b={row.b} type={row.type} /> }
    ];

    const dimensionColumns = [
        { key: 'name', label: selectedDimensionLabel, sortable: true },
        { key: 'revenue', label: 'Ciro', sortable: true, formatter: formatCurrency },
        { key: 'orders', label: 'Sipariş', sortable: true, formatter: formatNumber },
        { key: 'aov', label: 'AOV', sortable: true, formatter: formatCurrency },
        { key: 'items_sold', label: 'Adet', sortable: true, formatter: formatNumber },
        { key: 'items_per_order', label: 'Adet / Sipariş', sortable: true, formatter: formatNumber },
        { key: 'revenue_per_customer', label: 'Müşteri Başına Ciro', sortable: true, formatter: formatCurrency },
        { key: 'unique_customers', label: 'Tekil Müşteri', sortable: true, formatter: formatNumber },
        { key: 'discount_amount', label: 'İndirim', sortable: true, formatter: formatCurrency },
        { key: 'refund_amount', label: 'İade', sortable: true, formatter: formatCurrency },
        { key: 'refund_rate', label: 'İade Oranı', sortable: true, formatter: formatPercent }
    ];

    const cityColumns = [
        { key: 'city', label: 'Şehir', sortable: true },
        { key: 'orders', label: 'Sipariş Sayısı', sortable: true, formatter: formatNumber },
        { key: 'revenue', label: 'Net Ciro', sortable: true, formatter: formatCurrency },
        { key: 'refund_rate', label: 'İade Oranı', sortable: true, formatter: formatPercent },
    ];

    const normalizeMetric = (value, max) => max > 0 ? Math.round((Number(value || 0) / max) * 100) : 0;
    const radarMax = {
        revenue: Math.max(itemA?.revenue || 0, itemB?.revenue || 0),
        orders: Math.max(itemA?.orders || 0, itemB?.orders || 0),
        aov: Math.max(itemA?.aov || 0, itemB?.aov || 0),
        items: Math.max(itemA?.items_per_order || 0, itemB?.items_per_order || 0),
        customers: Math.max(itemA?.unique_customers || 0, itemB?.unique_customers || 0)
    };
    const radarSeries = itemA && itemB ? [
        { name: itemA.name, data: [normalizeMetric(itemA.revenue, radarMax.revenue), normalizeMetric(itemA.orders, radarMax.orders), normalizeMetric(itemA.aov, radarMax.aov), normalizeMetric(itemA.items_per_order, radarMax.items), normalizeMetric(itemA.unique_customers, radarMax.customers)] },
        { name: itemB.name, data: [normalizeMetric(itemB.revenue, radarMax.revenue), normalizeMetric(itemB.orders, radarMax.orders), normalizeMetric(itemB.aov, radarMax.aov), normalizeMetric(itemB.items_per_order, radarMax.items), normalizeMetric(itemB.unique_customers, radarMax.customers)] }
    ] : [];
    const radarOptions = {
        chart: { type: 'radar', toolbar: { show: false }, background: 'transparent', fontFamily: 'var(--font-sans)' },
        colors: ['#0085db', '#10b981'],
        xaxis: { categories: ['Ciro', 'Sipariş', 'AOV', 'Adet/Sipariş', 'Müşteri'], labels: { style: { colors: Array(5).fill('var(--color-text-muted)') } } },
        yaxis: { show: false, max: 100 },
        fill: { opacity: 0.12 },
        stroke: { width: 2 },
        markers: { size: 3 },
        legend: { labels: { colors: 'var(--color-text-secondary)' } },
        tooltip: { theme: 'dark' }
    };

    const selectedBarOptions = {
        chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: 'var(--font-sans)' },
        colors: ['#0085db', '#10b981'],
        plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
        dataLabels: { enabled: false },
        xaxis: { categories: [itemA?.name, itemB?.name].filter(Boolean), labels: { style: { colors: 'var(--color-text-muted)' } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: 'var(--color-text-muted)' }, formatter: formatCurrency } },
        grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 },
        legend: { labels: { colors: 'var(--color-text-secondary)' } },
        tooltip: { theme: 'dark', y: { formatter: formatCurrency } }
    };

    const horizontalOptions = (color, formatter) => ({
        chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: 'var(--font-sans)' },
        colors: [color],
        plotOptions: { bar: { borderRadius: 4, horizontal: true } },
        dataLabels: { enabled: false },
        xaxis: { labels: { style: { colors: 'var(--color-text-muted)' }, formatter } },
        yaxis: { labels: { style: { colors: 'var(--color-text-muted)', fontSize: '11px' } } },
        grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 },
        tooltip: { theme: 'dark', y: { formatter } }
    });

    if (error) {
        return <div style={{ padding: '24px', color: 'var(--color-accent-danger)' }}>Satış verisi yüklenirken hata oluştu: {error.message}</div>;
    }

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Satış ve Coğrafi Analiz</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Bölge, ürün, cihaz ve ödeme yöntemi bazında satış performansını karşılaştırın.
            </p>

            <FilterPanel />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Toplam Ciro" value={s.revenue || 0} prefix="TL " change={compareEnabled ? calculateChange(s.revenue || 0, prevSales.revenue || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Toplam Sipariş" value={s.orders || 0} change={compareEnabled ? calculateChange(s.orders || 0, prevSales.orders || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Sepet Ortalaması (AOV)" value={s.aov || 0} prefix="TL " change={compareEnabled ? calculateChange(s.aov || 0, prevSales.aov || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="İade Tutarı" value={s.refund_amount || 0} prefix="TL " change={compareEnabled ? calculateChange(s.refund_amount || 0, prevSales.refund_amount || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="İade Oranı" value={s.refund_rate || 0} suffix="%" change={compareEnabled ? calculateChange(s.refund_rate || 0, prevSales.refund_rate || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
                <KpiCard title="Tekrar Satın Alma" value={s.repeat_purchase_rate || 0} suffix="%" change={compareEnabled ? calculateChange(s.repeat_purchase_rate || 0, prevSales.repeat_purchase_rate || 0) : undefined} comparisonLabel={comparisonLabel} isLoading={isLoading} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <DonutChart data={donutData} isLoading={isLoading} title="Şehir Ciro Payı" />
                <BarChart data={adFormatData} isLoading={isLoading} title="Reklam Formatına Göre Ciro" />
            </div>

            <div style={comparisonSectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                            Karşılaştırma Modülü
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{selectedDimensionLabel} Karşılaştırma</h2>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                            Ürün, şehir, cihaz veya ödeme yöntemi seçip iki değeri satış metrikleriyle yan yana inceleyin.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <select value={dimension} onChange={(event) => setDimension(event.target.value)} style={{ minWidth: '180px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                            {dimensionOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                        <select value={selectedA} onChange={(event) => setSelectedA(event.target.value)} style={{ minWidth: '220px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                            {dimensionRows.map((row) => <option key={row.name} value={row.name}>{row.name}</option>)}
                        </select>
                        <select value={selectedB} onChange={(event) => setSelectedB(event.target.value)} style={{ minWidth: '220px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                            {dimensionRows.map((row) => <option key={row.name} value={row.name}>{row.name}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                    <DataTable title="Seçili Satış Metrikleri" columns={comparisonColumns} data={comparisonRows} exportFileName="satış-karşılaştırma.csv" rowsPerPage={10} isLoading={isDimensionLoading} />
                    <ChartCard title="Normalize Performans Profili">
                        <Chart options={radarOptions} series={radarSeries} type="radar" height={330} />
                    </ChartCard>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    <ChartCard title="Ciro - AOV Karşılaştırması">
                        <Chart
                            options={selectedBarOptions}
                            series={[
                                { name: 'Ciro', data: [itemA?.revenue || 0, itemB?.revenue || 0] },
                                { name: 'AOV', data: [itemA?.aov || 0, itemB?.aov || 0] }
                            ]}
                            type="bar"
                            height={320}
                        />
                    </ChartCard>
                    <ChartCard title={`En Yüksek Ciro: ${selectedDimensionLabel}`}>
                        <Chart
                            options={horizontalOptions('#8763da', formatCurrency)}
                            series={[{ name: 'Ciro', data: topRows.map((row) => ({ x: row.name, y: row.revenue })) }]}
                            type="bar"
                            height={320}
                        />
                    </ChartCard>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <ChartCard title={`İade Riski: ${selectedDimensionLabel}`} subtitle="İade oranı yüksek değerleri takip edin">
                        <Chart
                            options={horizontalOptions('#fb977d', (value) => `%${Number(value || 0).toFixed(1)}`)}
                            series={[{ name: 'İade Oranı', data: riskyRows.map((row) => ({ x: row.name, y: row.refund_rate })) }]}
                            type="bar"
                            height={300}
                        />
                    </ChartCard>
                </div>
            </div>

            <DataTable
                title={`${selectedDimensionLabel} Bazlı Satış Detayı`}
                columns={dimensionColumns}
                data={dimensionRows}
                exportFileName="satış_boyut_detayi.csv"
                rowsPerPage={8}
                isLoading={isDimensionLoading}
                enableGrouping
                groupByOptions={['name']}
            />

            <div style={{ height: '24px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
                <DataTable title="Şehir Bazlı Satış Performansi" columns={cityColumns} data={cityData} exportFileName="şehir_satış_performans.csv" rowsPerPage={5} isLoading={isLoading} enableGrouping groupByOptions={['city']} />
                <DataTable
                    title="Reklam Formatı Analizi"
                    columns={[
                        { key: 'format', label: 'Reklam Formatı', sortable: true },
                        { key: 'orders', label: 'Sipariş Sayısı', sortable: true, formatter: formatNumber },
                        { key: 'revenue', label: 'Net Ciro', sortable: true, formatter: formatCurrency }
                    ]}
                    data={adFormatDataRaw}
                    exportFileName="reklam_formati_satış_performans.csv"
                    rowsPerPage={5}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}


