import React from 'react';
import Chart from 'react-apexcharts';
import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';

export default function ScatterChart({ data = [], isLoading, title = 'ROAS vs Harcama Dağılımı' }) {
    const containerStyle = { background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' };

    if (isLoading) {
        return (
            <div style={containerStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-primary)' }}>{title}</h3>
                <LoadingState message="Dagilim grafik yukleniyor..." height={300} />
            </div>
        );
    }

    if (!data || !data.length) {
        return (
            <div style={containerStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-primary)' }}>{title}</h3>
                <EmptyState message="Scatter verisi bulunamadi." height={300} />
            </div>
        );
    }

    // Veriyi [{x: spend, y: roas, label: campaign_name}] formatına dönüştür
    const seriesData = data
        .filter(d => (d.spend > 0 || d.analytics_revenue > 0))
        .map(d => ({
            x: Number(d.spend || 0),
            y: Number(d.analytics_roas || d.roas || d.platform_roas || 0),
            label: d.campaign_name || d.channel || 'Bilinmiyor'
        }));

    const avgRoas = seriesData.reduce((sum, d) => sum + d.y, 0) / (seriesData.length || 1);

    const options = {
        chart: {
            type: 'scatter',
            height: 350,
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
            zoom: { enabled: true, type: 'xy' }
        },
        colors: ['#6366f1'],
        markers: { size: 8, strokeWidth: 0, fillOpacity: 0.9 },
        xaxis: {
            title: { text: 'Reklam Harcaması (₺)', style: { color: 'var(--color-text-muted)' } },
            labels: {
                style: { colors: 'var(--color-text-muted)' },
                formatter: (val) => '₺' + Math.round(val).toLocaleString('tr-TR')
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            title: { text: 'ROAS', style: { color: 'var(--color-text-muted)' } },
            labels: {
                style: { colors: 'var(--color-text-muted)' },
                formatter: (val) => val.toFixed(2) + 'x'
            }
        },
        annotations: {
            yaxis: [{
                y: avgRoas,
                borderColor: '#f59e0b',
                strokeDashArray: 4,
                label: {
                    text: `Ort. ROAS: ${avgRoas.toFixed(2)}x`,
                    style: { color: '#f59e0b', background: 'transparent', fontSize: '12px' }
                }
            }]
        },
        grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
        theme: { mode: 'dark' },
        tooltip: {
            theme: 'dark',
            custom: ({ seriesIndex, dataPointIndex, w }) => {
                const point = seriesData[dataPointIndex];
                if (!point) return '';
                return `<div style="padding:10px 14px;background:#1e2535;border:1px solid #2d3748;border-radius:8px;font-size:13px">
                    <div style="font-weight:600;color:#f1f5f9;margin-bottom:6px">${point.label}</div>
                    <div style="color:#94a3b8">Harcama: <b style="color:#f1f5f9">₺${point.x.toLocaleString('tr-TR')}</b></div>
                    <div style="color:#94a3b8">ROAS: <b style="color:${point.y >= avgRoas ? '#10b981' : '#ef4444'}">${point.y.toFixed(2)}x</b></div>
                </div>`;
            }
        },
        legend: { show: false }
    };

    const series = [{ name: 'Kampanya', data: seriesData.map(d => ({ x: d.x, y: d.y })) }];

    return (
        <div style={containerStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-primary)' }}>
                {title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                Yüksek harcama her zaman yüksek ROAS garantilemez — dağılımı inceleyin
            </p>
            <Chart options={options} series={series} type="scatter" height={350} />
        </div>
    );
}
