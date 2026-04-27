import React from 'react';
import Chart from 'react-apexcharts';
import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';

export default function TrendChart({ data = [], isLoading, title = 'Günlük Ciro & Sipariş Trendi' }) {
    const containerStyle = { background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' };

    if (isLoading) {
        return (
            <div style={containerStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-text-primary)' }}>{title}</h3>
                <LoadingState message="Trend grafik yukleniyor..." height={300} />
            </div>
        );
    }

    if (!data.length) {
        return (
            <div style={containerStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-text-primary)' }}>{title}</h3>
                <EmptyState message="Mevcut filtrede trend verisi bulunamadi." height={300} />
            </div>
        );
    }

    const series = [
        {
            name: 'Ciro',
            data: data.map(d => d.revenue)
        },
        {
            name: 'Sipariş Sayısı',
            data: data.map(d => d.orders)
        }
    ];

    const options = {
        chart: {
            type: 'area',
            height: 350,
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
        },
        colors: ['#6366f1', '#10b981'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.05,
                stops: [0, 90, 100]
            }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            categories: data.map(d => d.date),
            labels: { style: { colors: 'var(--color-text-muted)' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: [
            {
                title: { text: 'Ciro (₺)', style: { color: 'var(--color-text-muted)' } },
                labels: { style: { colors: 'var(--color-text-muted)' }, formatter: val => '₺' + parseInt(val).toLocaleString('tr-TR') }
            },
            {
                opposite: true,
                title: { text: 'Sipariş Sayısı', style: { color: 'var(--color-text-muted)' } },
                labels: { style: { colors: 'var(--color-text-muted)' }, formatter: val => parseInt(val) }
            }
        ],
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.05)',
            strokeDashArray: 4,
        },
        theme: { mode: 'dark' },
        tooltip: { theme: 'dark' }
    };

    return (
        <div style={containerStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-text-primary)' }}>{title}</h3>
            <Chart options={options} series={series} type="area" height={350} />
        </div>
    );
}
