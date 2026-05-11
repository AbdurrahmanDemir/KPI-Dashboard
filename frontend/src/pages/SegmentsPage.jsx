import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import useFilterStore from '../store/filterStore';
import DataTable from '../components/ui/DataTable';
import { extractAppliedFilters, normalizeSegmentRulesConfig, getSegmentTypeMeta } from '../utils/segmentBuilder';

export default function SegmentsPage() {
    const queryClient = useQueryClient();
    const { setFilters } = useFilterStore();

    const { data, isLoading, error } = useQuery({
        queryKey: ['segments'],
        queryFn: async () => (await api.get('/segments')).data.data || []
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => api.delete(`/segments/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['segments'] })
    });

    const applySegment = (segment) => {
        setFilters(extractAppliedFilters(segment.rules_config));
    };

    const columns = [
        { key: 'name', label: 'Segment Adı', sortable: true },
        {
            key: 'segment_type',
            label: 'Tip',
            sortable: true,
            formatter: (_, row) => getSegmentTypeMeta(normalizeSegmentRulesConfig(row).segment_type).label
        },
        {
            key: 'rule_count',
            label: 'Kural',
            sortable: true,
            formatter: (_, row) => normalizeSegmentRulesConfig(row).rules.length || Object.keys(extractAppliedFilters(row.rules_config)).length
        },
        {
            key: 'created_at',
            label: 'Oluşturulma',
            sortable: true,
            formatter: (value) => value ? new Date(value).toLocaleDateString('tr-TR') : '-'
        },
        {
            key: 'actions',
            label: 'İşlemler',
            sortable: false,
            formatter: (_, row) => (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                        to={`/segments/${row.id}`}
                        style={{ padding: '5px 10px', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 700, border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                        Detay
                    </Link>
                    <button
                        onClick={() => applySegment(row)}
                        style={{ padding: '5px 10px', background: 'rgba(99,102,241,0.1)', border: '1px solid var(--color-accent-primary)', color: 'var(--color-accent-primary)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                    >
                        Uygula
                    </button>
                    <Link
                        to={`/segments/${row.id}/edit`}
                        style={{ padding: '5px 10px', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 700, border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                        Düzenle
                    </Link>
                    <button
                        onClick={() => {
                            if (window.confirm('Bu segment silinsin mi?')) {
                                deleteMutation.mutate(row.id);
                            }
                        }}
                        style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', color: '#dc2626', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                    >
                        Sil
                    </button>
                </div>
            )
        }
    ];

    if (error) {
        return <div style={{ padding: '24px', color: 'var(--color-accent-danger)' }}>Segmentler yüklenemedi.</div>;
    }

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Segment Yönetimi</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        Reklam analizi için tekrar kullanılabilir hedefleme ve filtre segmentlerini yönetin.
                    </p>
                </div>
                <Link
                    to="/segments/new"
                    style={{ padding: '10px 18px', background: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}
                >
                    + Yeni Segment
                </Link>
            </div>

            <DataTable
                title={`Kayıtlı Segmentler (${(data || []).length})`}
                columns={columns}
                data={data || []}
                exportFileName="segmentler.csv"
                rowsPerPage={10}
                isLoading={isLoading}
                enableGrouping
                groupByOptions={['name']}
            />
        </div>
    );
}

