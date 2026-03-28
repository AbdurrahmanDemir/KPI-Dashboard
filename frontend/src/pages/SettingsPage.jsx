import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import DataTable from '../components/ui/DataTable';

export default function SettingsPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [mappingForm, setMappingForm] = useState({ source: '', medium: '', channel_group: '', platform: '', is_paid: false });

    const { data: mappings } = useQuery({
        queryKey: ['channel-mappings'],
        queryFn: async () => (await api.get('/mappings/channels')).data.data || []
    });

    const createMappingMutation = useMutation({
        mutationFn: async () => {
            await api.post('/mappings/channels', mappingForm);
        },
        onSuccess: () => {
            setMappingForm({ source: '', medium: '', channel_group: '', platform: '', is_paid: false });
            queryClient.invalidateQueries({ queryKey: ['channel-mappings'] });
        }
    });

    const deleteMappingMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/mappings/channels/${id}`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channel-mappings'] })
    });

    const columns = [
        { key: 'source', label: 'Source', sortable: true },
        { key: 'medium', label: 'Medium', sortable: true },
        { key: 'channel_group', label: 'Channel Group', sortable: true },
        { key: 'platform', label: 'Platform', sortable: true },
        { key: 'is_paid', label: 'Paid', sortable: true, formatter: (v) => v ? 'Yes' : 'No' },
        {
            key: 'id',
            label: 'Islem',
            sortable: false,
            formatter: (value) => (
                <button onClick={() => deleteMappingMutation.mutate(value)} style={{ padding: '6px 10px', border: '1px solid #ef4444', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}>
                    Sil
                </button>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Ayarlar</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Profil ozeti ve kanal esleme yonetimini bu ekrandan yapin.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Profil</h2>
                    <p style={{ margin: '0 0 8px 0' }}><strong>Ad:</strong> {user?.name}</p>
                    <p style={{ margin: '0 0 8px 0' }}><strong>E-posta:</strong> {user?.email}</p>
                    <p style={{ margin: 0 }}><strong>Rol:</strong> {user?.role}</p>
                </div>

                <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Yeni Kanal Esleme</h2>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        <input value={mappingForm.source} onChange={(e) => setMappingForm((prev) => ({ ...prev, source: e.target.value }))} placeholder="source" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                        <input value={mappingForm.medium} onChange={(e) => setMappingForm((prev) => ({ ...prev, medium: e.target.value }))} placeholder="medium" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                        <input value={mappingForm.channel_group} onChange={(e) => setMappingForm((prev) => ({ ...prev, channel_group: e.target.value }))} placeholder="channel_group" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                        <input value={mappingForm.platform} onChange={(e) => setMappingForm((prev) => ({ ...prev, platform: e.target.value }))} placeholder="platform" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="checkbox" checked={mappingForm.is_paid} onChange={(e) => setMappingForm((prev) => ({ ...prev, is_paid: e.target.checked }))} />
                            Paid traffic
                        </label>
                        <button onClick={() => createMappingMutation.mutate()} style={{ padding: '12px', background: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                            Kaydet
                        </button>
                    </div>
                </div>
            </div>

            <DataTable title="Kanal Esleme Listesi" columns={columns} data={mappings || []} exportFileName="channel_mappings.csv" rowsPerPage={8} />
        </div>
    );
}
