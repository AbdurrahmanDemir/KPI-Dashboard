import React from 'react';
import Chart from 'react-apexcharts';

export default function BarChart({ data = [], isLoading }) {
    if (isLoading) {
        return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>Grafik Yükleniyor...</div>;
    }

    const options = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
        },
        colors: ['#6366f1'],
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: '45%'
            }
        },
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: data.map(d => d.channel),
            labels: { style: { colors: 'var(--color-text-muted)' }, formatter: val => '₺' + parseInt(val).toLocaleString('tr-TR') },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: { style: { colors: 'var(--color-text-primary)' } }
        },
        grid: {
            borderColor: 'var(--color-border)',
            strokeDashArray: 3,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } }
        },
        theme: { mode: 'light' },
        tooltip: { theme: 'light' }
    };

    const series = [{
        name: 'Ciro',
        data: data.map(d => d.revenue)
    }];

    return (
        <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-text-primary)' }}>Kanal Bazlı Ciro</h3>
            <Chart options={options} series={series} type="bar" height={300} />
        </div>
    );
}
