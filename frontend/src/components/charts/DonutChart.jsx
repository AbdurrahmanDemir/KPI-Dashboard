import React from 'react';
import Chart from 'react-apexcharts';
import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';

export default function DonutChart({ data = [], isLoading, title = 'Platform Dagilimi' }) {
    const containerStyle = { background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', flex: 1 };

    if (isLoading) {
        return (
            <div style={containerStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-text-primary)' }}>{title}</h3>
                <LoadingState message="Dagilim grafik yukleniyor..." height={250} />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div style={containerStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-text-primary)' }}>{title}</h3>
                <EmptyState message="Gosterilecek dagilim verisi bulunamadi." height={250} />
            </div>
        );
    }

    const series = data.map((d) => parseInt(d.sessions, 10));
    const labels = data.map((d) => d.platform);

    const options = {
        chart: {
            type: 'donut',
            fontFamily: 'var(--font-sans)',
            background: 'transparent',
        },
        labels,
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6'],
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        name: { color: 'var(--color-text-muted)' },
                        value: { color: 'var(--color-text-primary)' },
                        total: {
                            show: true,
                            color: 'var(--color-text-primary)',
                            label: 'Toplam'
                        }
                    }
                }
            }
        },
        legend: {
            position: 'bottom',
            labels: { colors: 'var(--color-text-primary)' }
        },
        stroke: { show: false },
        theme: { mode: 'light' },
        dataLabels: { enabled: false },
        tooltip: { theme: 'light' }
    };

    return (
        <div style={containerStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-text-primary)' }}>{title}</h3>
            <Chart options={options} series={series} type="donut" height={300} />
        </div>
    );
}
