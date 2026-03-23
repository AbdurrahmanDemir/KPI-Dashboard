import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useFilterStore from '../../store/filterStore';
import api from '../../services/api';

export default function FilterPanel() {
    const { filters, setFilter, setFilters, resetFilters } = useFilterStore();
    const queryClient = useQueryClient();
    const [segmentName, setSegmentName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);

    // Segmentleri Getir
    const { data: segmentsData } = useQuery({
        queryKey: ['segments'],
        queryFn: async () => {
            const res = await api.get('/segments');
            return res.data.data || [];
        }
    });

    // Segment Kaydet
    const saveSegmentMutation = useMutation({
        mutationFn: async () => {
            await api.post('/segments', { name: segmentName, rules_config: filters });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['segments']);
            setSegmentName('');
            setShowSaveInput(false);
            alert('Segment başarıyla kaydedildi!');
        }
    });

    // Segment Seçici
    const handleSegmentSelect = (e) => {
        const id = e.target.value;
        if (!id) return;
        const target = segmentsData.find(s => s.id === parseInt(id));
        if (target && target.rules_config) {
            setFilters(target.rules_config);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            background: 'var(--color-bg-secondary)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            marginBottom: '24px',
            alignItems: 'flex-end',
        }}>
            {/* Kayıtlı Segmentler Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-accent-primary)', fontWeight: 600 }}>🌟 Özel Segment</label>
                <select 
                    onChange={handleSegmentSelect}
                    defaultValue=""
                    style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-accent-primary)',
                        background: 'rgba(99,102,241,0.1)',
                        color: 'var(--color-text-primary)'
                    }}
                >
                    <option value="">-- Kayıtlı Şablon Seç --</option>
                    {segmentsData?.map(seg => (
                        <option key={seg.id} value={seg.id}>{seg.name}</option>
                    ))}
                </select>
            </div>

            <div style={{ width: '1px', background: 'var(--color-border)', margin: '0 8px', alignSelf: 'stretch' }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Başlangıç Tarihi</label>
                <input 
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilter('start_date', e.target.value)}
                    style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Bitiş Tarihi</label>
                <input 
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilter('end_date', e.target.value)}
                    style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Kanal</label>
                <select 
                    value={filters.channel}
                    onChange={(e) => setFilter('channel', e.target.value)}
                    style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)',
                        minWidth: '150px'
                    }}
                >
                    <option value="">Tümü</option>
                    <option value="meta">Meta Ads</option>
                    <option value="google">Google Ads</option>
                    <option value="organic">Organic</option>
                    <option value="direct">Direct</option>
                    <option value="email">Email</option>
                    <option value="tiktok">TikTok Ads</option>
                </select>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', position: 'relative' }}>
                {showSaveInput ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                            type="text" 
                            placeholder="Segment Adı..." 
                            value={segmentName}
                            onChange={e => setSegmentName(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-accent-primary)', background: 'var(--color-bg-primary)', color: 'white' }}
                        />
                        <button 
                            onClick={saveSegmentMutation.mutate}
                            disabled={!segmentName}
                            style={{ padding: '8px 14px', background: 'var(--color-accent-primary)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Kaydet
                        </button>
                        <button 
                            onClick={() => setShowSaveInput(false)}
                            style={{ padding: '8px 14px', background: 'transparent', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer' }}
                        >
                            İptal
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setShowSaveInput(true)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-accent-primary)',
                            background: 'transparent',
                            color: 'var(--color-accent-primary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                    >
                        ➕ Bu Kriterleri Şablon Olarak Kaydet
                    </button>
                )}

                <button 
                    onClick={resetFilters}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    Filtreleri Sıfırla
                </button>
            </div>
        </div>
    );
}
