import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import { extractAppliedFilters, getOperatorMeta, getRuleFieldMeta, getSegmentTypeMeta, normalizeSegmentRulesConfig } from '../utils/segmentBuilder';

const cardStyle = {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    padding: '18px',
};

export default function SegmentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setFilters } = useFilterStore();

    const { data, isLoading, error } = useQuery({
        queryKey: ['segment-detail', id],
        queryFn: async () => (await api.get(`/segments/${id}`)).data.data,
    });

    const { data: previewData } = useQuery({
        queryKey: ['segment-preview', id],
        queryFn: async () => (await api.get(`/segments/${id}/preview`)).data.data,
    });

    const deleteMutation = useMutation({
        mutationFn: async () => api.delete(`/segments/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['segments'] });
            navigate('/segments');
        }
    });

    if (isLoading) {
        return <div style={{ padding: '24px', color: 'var(--color-text-secondary)' }}>Segment detayı yükleniyor...</div>;
    }

    if (error || !data) {
        return <div style={{ padding: '24px', color: 'var(--color-accent-danger)' }}>Segment detayı yüklenemedi.</div>;
    }

    const config = normalizeSegmentRulesConfig(data);
    const segmentType = getSegmentTypeMeta(config.segment_type);
    const appliedFilters = previewData?.applied_filters || extractAppliedFilters(data.rules_config);
    const previewCount = previewData?.preview_count;

    return (
        <div style={{ padding: '24px', display: 'grid', gap: '24px', color: 'var(--color-text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <Link to="/segments" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)', fontWeight: 700 }}>← Segmentler</Link>
                    <div style={{ marginTop: '16px', display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: 'rgba(99,102,241,0.08)', color: 'var(--color-accent-primary)', fontWeight: 700, fontSize: '12px' }}>
                        {segmentType.label}
                    </div>
                    <h1 style={{ fontSize: '32px', lineHeight: 1.1, margin: '12px 0 8px', fontWeight: 800 }}>{data.name}</h1>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{config.description || 'Bu segment için açıklama eklenmemiş.'}</p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to={`/segments/${id}/edit`} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: 700 }}>
                        Düzenle
                    </Link>
                    <button
                        onClick={() => setFilters(appliedFilters)}
                        style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-accent-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Uygula
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm('Bu segment silinsin mi?')) {
                                deleteMutation.mutate();
                            }
                        }}
                        style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Sil
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
                <div style={cardStyle}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Tahmini Büyüklük</div>
                    <div style={{ fontSize: '30px', fontWeight: 800 }}>{previewCount ?? '-'}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                        {previewCount === null || previewCount === undefined ? 'Bu segment tipi için canlı hesaplama yok.' : 'Mevcut veri üzerinden hesaplandı.'}
                    </div>
                </div>
                <div style={cardStyle}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Son Hesaplama</div>
                    <div style={{ fontSize: '20px', fontWeight: 800 }}>{previewData ? 'Hazır' : '-'}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Preview endpoint cevabına göre</div>
                </div>
                <div style={cardStyle}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Kural Sayısı</div>
                    <div style={{ fontSize: '30px', fontWeight: 800 }}>{config.rules.length || Object.keys(appliedFilters).length}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>AND bağlacı ile</div>
                </div>
                <div style={cardStyle}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Oluşturulma</div>
                    <div style={{ fontSize: '20px', fontWeight: 800 }}>{data.created_at ? new Date(data.created_at).toLocaleString('tr-TR') : '-'}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Kayıt zamanı</div>
                </div>
            </div>

            <section style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, fontSize: '18px' }}>Segment Kuralları</h2>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{config.rules.length} kural • {String(config.logical_operator || 'and').toUpperCase()}</div>
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                    {config.rules.length > 0 ? config.rules.map((rule, index) => {
                        const field = getRuleFieldMeta(rule.field);
                        const operator = getOperatorMeta(rule.operator);
                        return (
                            <div key={rule.id || `${rule.field}-${index}`} style={{ display: 'grid', gridTemplateColumns: '84px 1fr 1fr 1.4fr', gap: '10px', alignItems: 'center', padding: '12px', borderRadius: '10px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: index === 0 ? 'var(--color-accent-primary)' : 'var(--color-text-muted)' }}>{index === 0 ? 'GİRİŞ' : 'AND'}</div>
                                <div style={{ fontWeight: 700 }}>{field.label}</div>
                                <div style={{ color: 'var(--color-text-secondary)' }}>{operator.label}</div>
                                <div>{String(rule.value)}</div>
                            </div>
                        );
                    }) : (
                        <div style={{ color: 'var(--color-text-secondary)' }}>Bu segment eski filtre formatı ile kaydedilmiş. Uygulanabilir filtreler aşağıda listeleniyor.</div>
                    )}
                </div>
            </section>

            <section style={cardStyle}>
                <h2 style={{ marginTop: 0, fontSize: '18px' }}>Uygulanacak Filtreler</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                    {Object.entries(appliedFilters).length > 0 ? Object.entries(appliedFilters).map(([key, value]) => (
                        <div key={key} style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{key}</div>
                            <div style={{ fontWeight: 700 }}>{String(value)}</div>
                        </div>
                    )) : (
                        <div style={{ color: 'var(--color-text-secondary)' }}>Bu segmentten filtre çıkartılamadı.</div>
                    )}
                </div>
            </section>
        </div>
    );
}

