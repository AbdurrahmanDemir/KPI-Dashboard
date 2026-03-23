import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import DataTable from '../components/ui/DataTable';

export default function LogsPage() {
    const { data: logsData, isLoading } = useQuery({
        queryKey: ['logs'],
        queryFn: async () => {
            const res = await api.get('/logs?limit=100');
            return res.data.data.logs || [];
        }
    });

    const columns = [
        { key: 'user_id', label: 'User ID', sortable: true },
        { 
            key: 'action', 
            label: 'Aksiyon', 
            sortable: true,
            formatter: (v) => <span style={{ padding: '4px 8px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{v.toUpperCase()}</span>
        },
        { key: 'entity_type', label: 'Modül', sortable: true },
        { 
            key: 'payload', 
            label: 'Detay', 
            sortable: false,
            formatter: (v) => <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{JSON.stringify(v)}</span>
        },
        { key: 'created_at', label: 'Tarih', formatter: v => new Date(v).toLocaleString('tr-TR') }
    ];

    if (isLoading) return <div style={{ padding: '24px' }}>Yükleniyor...</div>;

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Sistem Logları</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Güvenlik denetimi ve son aktiviteleri izleyin. (Sadece Yöneticiler)
            </p>

            <DataTable title="Son 100 İşlem Kaydı" columns={columns} data={logsData} exportFileName="audit_logs.csv" rowsPerPage={10} />
        </div>
    );
}
