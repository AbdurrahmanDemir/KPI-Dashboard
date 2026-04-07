import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import DataTable from '../components/ui/DataTable';

export default function SegmentsPage() {
    const queryClient = useQueryClient();
    const { setFilters } = useFilterStore();
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['segments'],
        queryFn: async () => (await api.get('/segments')).data.data || []
    });

    const createMutation = useMutation({
        mutationFn: async () => api.post('/segments', { name: newName, rules_config: {} }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['segments'] });
            setNewName('');
            setShowCreate(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => api.delete(`/segments/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['segments'] })
    });

    const applySegment = (segment) => {
        if (segment?.rules_config) {
            setFilters(segment.rules_config);
        }
    };

    const columns = [
        { key: 'name', label: 'Segment Adı', sortable: true },
        {
            key: 'created_at', label: 'Oluşturulma Tarihi', sortable: true,
            formatter: (v) => v ? new Date(v).toLocaleDateString('tr-TR') : '—'
        },
        {
            key: 'actions', label: 'İşlemler', sortable: false,
            formatter: (_, row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => applySegment(row)}
                        style={{ padding: '4px 10px', background: 'rgba(99,102,241,0.1)', border: '1px solid var(--color-accent-primary)', color: 'var(--color-accent-primary)', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                    >
                        ✓ Uygula
                    </button>
                    <button
                        onClick={() => { if (window.confirm('Bu segmenti silmek istediğinizden emin misiniz?')) deleteMutation.mutate(row.id); }}
                        style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                    >
                        Sil
                    </button>
                </div>
            )
        }
    ];

    if (error) {
        return <div style={{ padding: '24px', color: 'var(--color-accent-danger)' }}>Segment verisi yüklenirken hata oluştu: {error.message}</div>;
    }

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Segment Yönetimi</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        Kayıtlı filtre kombinasyonlarınızı yönetin — bir tıkla tüm dashboard'a uygulayın.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    style={{ padding: '10px 18px', background: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                    + Yeni Segment
                </button>
            </div>

            {showCreate && (
                <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                    <h3 style={{ marginTop: 0, fontSize: '16px' }}>Yeni Segment Oluştur</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        Mevcut filtreleri kaydetmek için önce FilterPanel'dan filtrelerinizi ayarlayın, ardından FilterPanel'daki "Şablon Olarak Kaydet" butonunu kullanın. Buradan boş bir segment de oluşturabilirsiniz.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Segment adı..."
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: '14px' }}
                        />
                        <button
                            onClick={() => createMutation.mutate()}
                            disabled={!newName || createMutation.isPending}
                            style={{ padding: '10px 18px', background: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            {createMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button
                            onClick={() => setShowCreate(false)}
                            style={{ padding: '10px 14px', background: 'transparent', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer' }}
                        >
                            İptal
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Yükleniyor...</div>
            ) : (data || []).length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    Henüz kayıtlı segment bulunmuyor. FilterPanel'dan filtreleri ayarlayıp şablon olarak kaydedin.
                </div>
            ) : (
                <DataTable
                    title={`Kayıtlı Segmentler (${(data || []).length})`}
                    columns={columns}
                    data={data || []}
                    exportFileName="segmentler.csv"
                    rowsPerPage={10}
                />
            )}
        </div>
    );
}
