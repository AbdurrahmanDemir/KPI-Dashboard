import React from 'react';
import Chart from 'react-apexcharts';
import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';

export default function BarChart({ data = [], isLoading, onBarClick, title = 'Kanal Bazlı Ciro' }) {
    const containerStyle = { background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', flex: 1 };

    if (isLoading) {
        return (
            <div style={containerStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-text-primary)' }}>{title}</h3>
                <LoadingState message="Bar grafik yukleniyor..." height={250} />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div style={containerStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-text-primary)' }}>{title}</h3>
                <EmptyState message="Gosterilecek kanal verisi bulunamadi." height={250} />
            </div>
        );
    }

    const options = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
            events: {
                dataPointSelection: (event, chartContext, config) => {
                    if (onBarClick) {
                        const label = data[config.dataPointIndex]?.channel;
                        if (label) onBarClick(label);
                    }
                }
            }
        },
        colors: ['#0085db', '#6366f1', '#8763da', '#10b981', '#f59e0b', '#ef4444'],
        plotOptions: {
            bar: {
                borderRadius: 5,
                horizontal: false,
                columnWidth: '50%',
                distributed: true
            }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: data.map((d) => d.channel),
            labels: { style: { colors: 'var(--color-text-muted)', fontSize: '12px' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: { colors: 'var(--color-text-muted)' },
                formatter: (val) => '₺' + Math.round(val).toLocaleString('tr-TR')
            }
        },
        grid: {
            borderColor: 'var(--color-border)',
            strokeDashArray: 4,
            xaxis: { lines: { show: false } }
        },
        legend: { show: false },
        tooltip: {
            theme: 'dark',
            y: { formatter: (val) => '₺' + Number(val).toLocaleString('tr-TR') }
        },
        states: {
            hover: { filter: { type: 'lighten', value: 0.1 } },
            active: { filter: { type: 'darken', value: 0.25 } }
        }
    };

    if (onBarClick) {
        options.chart.cursor = 'pointer';
    }

    const series = [{ name: 'Ciro', data: data.map((d) => d.revenue) }];

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{title}</h3>
                {onBarClick && (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        💡 Kanal seçmek için tıklayın
                    </span>
                )}
            </div>
            <Chart options={options} series={series} type="bar" height={300} />
        </div>
    );
}
