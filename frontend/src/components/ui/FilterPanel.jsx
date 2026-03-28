import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useFilterStore from '../../store/filterStore';
import api from '../../services/api';

export default function FilterPanel() {
    const { filters, setFilter, setFilters, resetFilters } = useFilterStore();
    const queryClient = useQueryClient();
    const [segmentName, setSegmentName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);

    const { data: segmentsData } = useQuery({
        queryKey: ['segments'],
        queryFn: async () => (await api.get('/segments')).data.data || []
    });

    const { data: filterOptions } = useQuery({
        queryKey: ['filter-options'],
        queryFn: async () => (await api.get('/filters/options')).data.data || {}
    });

    const saveSegmentMutation = useMutation({
        mutationFn: async () => {
            await api.post('/segments', { name: segmentName, rules_config: filters });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['segments'] });
            setSegmentName('');
            setShowSaveInput(false);
        }
    });

    const handleSegmentSelect = (e) => {
        const id = Number(e.target.value);
        if (!id) return;
        const target = segmentsData.find((segment) => segment.id === id);
        if (target?.rules_config) {
            setFilters(target.rules_config);
        }
    };

    const renderSelect = (key, label, options = [], optionLabel) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</label>
            <select
                value={filters[key] || ''}
                onChange={(e) => setFilter(key, e.target.value)}
                style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    minWidth: '150px'
                }}
            >
                <option value="">Tumu</option>
                {options.map((option) => {
                    const value = typeof option === 'string' ? option : option.value;
                    const labelValue = typeof option === 'string' ? option : optionLabel ? option[optionLabel] : option.label;
                    return <option key={value} value={value}>{labelValue}</option>;
                })}
            </select>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '24px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-accent-primary)', fontWeight: 600 }}>Kayitli Segment</label>
                <select
                    onChange={handleSegmentSelect}
                    defaultValue=""
                    style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-accent-primary)', background: 'rgba(99,102,241,0.1)', color: 'var(--color-text-primary)' }}
                >
                    <option value="">Sablon Sec</option>
                    {segmentsData?.map((segment) => <option key={segment.id} value={segment.id}>{segment.name}</option>)}
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Baslangic Tarihi</label>
                <input type="date" value={filters.start_date} onChange={(e) => setFilter('start_date', e.target.value)} style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Bitis Tarihi</label>
                <input type="date" value={filters.end_date} onChange={(e) => setFilter('end_date', e.target.value)} style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>

            {renderSelect('channel', 'Kanal', filterOptions?.channels || [])}
            {renderSelect('platform', 'Platform', filterOptions?.platforms || [])}
            {renderSelect('campaign_name', 'Kampanya', filterOptions?.campaigns || [])}
            {renderSelect('product_name', 'Urun', filterOptions?.products || [])}
            {renderSelect('city', 'Sehir', filterOptions?.cities || [])}
            {renderSelect('device', 'Cihaz', filterOptions?.devices || [])}
            {renderSelect('country', 'Ulke', filterOptions?.countries || [])}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', position: 'relative', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {showSaveInput ? (
                    <>
                        <input
                            type="text"
                            placeholder="Segment adi..."
                            value={segmentName}
                            onChange={(e) => setSegmentName(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-accent-primary)', background: 'var(--color-bg-primary)', color: 'white' }}
                        />
                        <button onClick={() => saveSegmentMutation.mutate()} disabled={!segmentName} style={{ padding: '8px 14px', background: 'var(--color-accent-primary)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                            Kaydet
                        </button>
                        <button onClick={() => setShowSaveInput(false)} style={{ padding: '8px 14px', background: 'transparent', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer' }}>
                            Iptal
                        </button>
                    </>
                ) : (
                    <button onClick={() => setShowSaveInput(true)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--color-accent-primary)', background: 'transparent', color: 'var(--color-accent-primary)', cursor: 'pointer', fontWeight: 600 }}>
                        Kriterleri Sablon Olarak Kaydet
                    </button>
                )}

                <button onClick={resetFilters} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>
                    Filtreleri Sifirla
                </button>
            </div>
        </div>
    );
}
