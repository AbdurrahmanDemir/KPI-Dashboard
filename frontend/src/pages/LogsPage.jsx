import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import DataTable from '../components/ui/DataTable';

const tabs = [
    { key: 'all', label: 'Tümü', endpoint: '/logs?limit=100', extractor: (res) => res.data.data.logs || [] },
    { key: 'api', label: 'API', endpoint: '/logs/api?limit=100', extractor: (res) => res.data.data || [] },
    { key: 'imports', label: 'Import', endpoint: '/logs/imports?limit=100', extractor: (res) => res.data.data || [] },
    { key: 'audit', label: 'Audit', endpoint: '/logs/audit?limit=100', extractor: (res) => res.data.data || [] },
];

const tabButtonStyle = (active) => ({
    padding: '8px 14px',
    borderRadius: '999px',
    border: `1px solid ${active ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
    background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
    color: active ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
});

export default function LogsPage() {
    const [activeTab, setActiveTab] = useState('all');
    const activeConfig = tabs.find((tab) => tab.key === activeTab) || tabs[0];

    const { data: logsData = [], isLoading } = useQuery({
        queryKey: ['logs', activeTab],
        queryFn: async () => {
            const res = await api.get(activeConfig.endpoint);
            return activeConfig.extractor(res);
        }
    });

    const columns = [
        { key: 'user_id', label: 'User ID', sortable: true },
        {
            key: 'action',
            label: 'Aksiyon',
            sortable: true,
            formatter: (value) => (
                <span style={{ padding: '4px 8px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                    {String(value || '').toUpperCase()}
                </span>
            )
        },
        { key: 'entity_type', label: 'Modül', sortable: true },
        {
            key: 'payload',
            label: 'Detay',
            sortable: false,
            formatter: (value) => (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                    {JSON.stringify(value)}
                </span>
            )
        },
        {
            key: 'created_at',
            label: 'Tarih',
            formatter: (value) => new Date(value).toLocaleString('tr-TR')
        }
    ];

    if (isLoading) {
        return <div style={{ padding: '24px' }}>Yükleniyor...</div>;
    }

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Sistem Logları</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
                Güvenlik denetimi, API istekleri ve import operasyonlarını ayrı ayrı izleyin. (Sadece yöneticiler)
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={tabButtonStyle(tab.key === activeTab)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <DataTable
                title={`Son 100 kayıt - ${activeConfig.label}`}
                columns={columns}
                data={logsData}
                exportFileName={`${activeTab}_logs.csv`}
                rowsPerPage={10}
            />
        </div>
    );
}
