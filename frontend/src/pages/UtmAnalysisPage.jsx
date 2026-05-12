import { useEffect, useRef, useState } from 'react';
import Chart from 'react-apexcharts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    IconChartBar,
    IconCopy,
    IconExternalLink,
    IconLink,
    IconPlayerPlay,
    IconPlus,
    IconRefresh,
    IconToggleLeft,
    IconToggleRight,
} from '@tabler/icons-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import DataTable from '../components/ui/DataTable';
import KpiCard from '../components/ui/KpiCard';

const cardStyle = {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: 'var(--shadow-card)',
};

const comparisonSectionStyle = {
    background: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
};

const formatCurrency = (value) => `TL ${Number(value || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
const formatPercent = (value) => `%${Number(value || 0).toFixed(2)}`;
const formatDateTime = (value) => value ? new Date(value).toLocaleString('tr-TR') : '-';

const initialForm = {
    name: '',
    destination_url: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
    notes: '',
};

function SectionHeader({ eyebrow, title, description }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            {eyebrow && (
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                    {eyebrow}
                </div>
            )}
            <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--color-text-primary)' }}>{title}</h2>
            {description && (
                <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                    {description}
                </p>
            )}
        </div>
    );
}

function ReadonlyLinkField({ label, value, onCopy }) {
    return (
        <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{label}</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                <input
                    readOnly
                    value={value || ''}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                    }}
                />
                <button
                    type="button"
                    onClick={onCopy}
                    style={{
                        width: '42px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-primary)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title="Kopyala"
                >
                    <IconCopy size={18} stroke={1.7} />
                </button>
            </div>
        </div>
    );
}

function MetricDelta({ a, b, formatter = (value) => value }) {
    const diff = Number(a || 0) - Number(b || 0);
    const color = diff > 0 ? 'var(--color-accent-success)' : diff < 0 ? 'var(--color-accent-danger)' : 'var(--color-text-muted)';
    return <span style={{ color, fontWeight: 700 }}>{diff > 0 ? '+' : ''}{formatter(diff)}</span>;
}

export default function UtmAnalysisPage() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const createdLinksRef = useRef(null);
    const [form, setForm] = useState(initialForm);
    const [days, setDays] = useState('30');
    const [selectedLinkId, setSelectedLinkId] = useState('');
    const [selectedComparisonA, setSelectedComparisonA] = useState('');
    const [selectedComparisonB, setSelectedComparisonB] = useState('');
    const [selectedSimulationId, setSelectedSimulationId] = useState('');
    const [lastCreatedLink, setLastCreatedLink] = useState(null);
    const [createdModalLink, setCreatedModalLink] = useState(null);
    const [feedback, setFeedback] = useState('');
    const canManage = ['admin', 'marketing_manager'].includes(user?.role);

    const { data: links = [], isLoading: isLinksLoading } = useQuery({
        queryKey: ['utm-links'],
        queryFn: async () => (await api.get('/utm/links')).data.data || [],
    });

    const analyticsQuery = useQuery({
        queryKey: ['utm-analytics', days, selectedLinkId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (days) params.set('days', days);
            if (selectedLinkId) params.set('link_id', selectedLinkId);
            return (await api.get(`/utm/analytics?${params.toString()}`)).data.data;
        },
    });

    const analytics = analyticsQuery.data || {
        summary: { total_links: 0, active_links: 0, clicks: 0, leads: 0, sales: 0, revenue: 0, lead_rate: 0, sale_rate: 0 },
        trend: [],
        source_medium_breakdown: [],
        campaign_breakdown: [],
        link_breakdown: [],
        event_mix: [],
    };

    const selectedLinkOptions = analytics.link_breakdown.length ? analytics.link_breakdown : links;
    const linkPreview = lastCreatedLink || links.find((item) => String(item.id) === String(selectedSimulationId)) || links[0] || null;

    useEffect(() => {
        if (!selectedSimulationId && links.length > 0) {
            setSelectedSimulationId(String(links[0].id));
        }
    }, [links, selectedSimulationId]);

    useEffect(() => {
        if (!selectedLinkOptions.length) return;
        setSelectedComparisonA((current) => selectedLinkOptions.some((item) => String(item.id) === current) ? current : String(selectedLinkOptions[0].id));
        setSelectedComparisonB((current) => selectedLinkOptions.some((item) => String(item.id) === current) ? current : String(selectedLinkOptions[1]?.id || selectedLinkOptions[0].id));
    }, [selectedLinkOptions]);

    const invalidateUtmData = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['utm-links'] }),
            queryClient.invalidateQueries({ queryKey: ['utm-analytics'] }),
        ]);
    };

    const createLinkMutation = useMutation({
        mutationFn: async (payload) => (await api.post('/utm/links', payload)).data.data,
        onSuccess: async (created) => {
            setLastCreatedLink(created);
            setCreatedModalLink(created);
            setForm(initialForm);
            setFeedback('UTM linki oluşturuldu.');
            await invalidateUtmData();
        },
        onError: (error) => {
            setFeedback(error.response?.data?.error?.message || 'UTM linki oluşturulamadı.');
        },
    });

    const toggleLinkMutation = useMutation({
        mutationFn: async ({ id, is_active }) => (await api.patch(`/utm/links/${id}`, { is_active })).data.data,
        onSuccess: async () => {
            setFeedback('UTM link durumu güncellendi.');
            await invalidateUtmData();
        },
        onError: (error) => {
            setFeedback(error.response?.data?.error?.message || 'Link durumu güncellenemedi.');
        },
    });

    const simulateMutation = useMutation({
        mutationFn: async ({ id, payload }) => (await api.post(`/utm/links/${id}/simulate`, payload)).data.data,
        onSuccess: async () => {
            setFeedback('Test etkinlikleri eklendi.');
            await invalidateUtmData();
        },
        onError: (error) => {
            setFeedback(error.response?.data?.error?.message || 'Test verisi eklenemedi.');
        },
    });

    const handleChange = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setFeedback('');
        createLinkMutation.mutate(form);
    };

    const copyText = async (text) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setFeedback('Link kopyalandı.');
        } catch {
            setFeedback('Kopyalama başarısız oldu.');
        }
    };

    const openCreatedLinksSection = () => {
        setCreatedModalLink(null);
        createdLinksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const runSimulation = (payload) => {
        if (!selectedSimulationId) return;
        setFeedback('');
        simulateMutation.mutate({ id: selectedSimulationId, payload });
    };

    const sourceBreakdownRows = analytics.source_medium_breakdown || [];
    const campaignBreakdownRows = analytics.campaign_breakdown || [];
    const linkBreakdownRows = analytics.link_breakdown || [];

    const selectedA = linkBreakdownRows.find((item) => String(item.id) === selectedComparisonA);
    const selectedB = linkBreakdownRows.find((item) => String(item.id) === selectedComparisonB);

    const comparisonMetricRows = selectedA && selectedB ? [
        { metric: 'Tıklama', a: selectedA.clicks, b: selectedB.clicks, type: 'number' },
        { metric: 'Lead', a: selectedA.leads, b: selectedB.leads, type: 'number' },
        { metric: 'Satış', a: selectedA.sales, b: selectedB.sales, type: 'number' },
        { metric: 'Gelir', a: selectedA.revenue, b: selectedB.revenue, type: 'currency' },
        { metric: 'Lead Oranı', a: selectedA.lead_rate, b: selectedB.lead_rate, type: 'percent' },
        { metric: 'Satış Oranı', a: selectedA.sale_rate, b: selectedB.sale_rate, type: 'percent' },
        { metric: 'Satış Başına Gelir', a: selectedA.revenue_per_sale, b: selectedB.revenue_per_sale, type: 'currency' },
    ] : [];

    const comparisonColumns = [
        { key: 'metric', label: 'Metrik', sortable: false },
        {
            key: 'a',
            label: selectedA?.name || 'Link A',
            sortable: false,
            formatter: (value, row) => row.type === 'currency' ? formatCurrency(value) : row.type === 'percent' ? formatPercent(value) : Number(value || 0).toLocaleString('tr-TR'),
        },
        {
            key: 'b',
            label: selectedB?.name || 'Link B',
            sortable: false,
            formatter: (value, row) => row.type === 'currency' ? formatCurrency(value) : row.type === 'percent' ? formatPercent(value) : Number(value || 0).toLocaleString('tr-TR'),
        },
        {
            key: 'delta',
            label: 'Fark',
            sortable: false,
            formatter: (_, row) => (
                <MetricDelta
                    a={row.a}
                    b={row.b}
                    formatter={(value) => row.type === 'currency' ? formatCurrency(value) : row.type === 'percent' ? formatPercent(value) : Number(value || 0).toLocaleString('tr-TR')}
                />
            ),
        },
    ];

    const radarSeries = selectedA && selectedB ? [
        { name: selectedA.name, data: [selectedA.clicks, selectedA.leads, selectedA.sales, selectedA.revenue, selectedA.sale_rate] },
        { name: selectedB.name, data: [selectedB.clicks, selectedB.leads, selectedB.sales, selectedB.revenue, selectedB.sale_rate] },
    ] : [];

    const radarOptions = {
        chart: { type: 'radar', toolbar: { show: false }, background: 'transparent', fontFamily: 'var(--font-sans)' },
        colors: ['#0085db', '#fb977d'],
        xaxis: { categories: ['Tıklama', 'Lead', 'Satış', 'Gelir', 'Satış Oranı'], labels: { style: { colors: Array(5).fill('var(--color-text-muted)') } } },
        yaxis: { labels: { style: { colors: 'var(--color-text-muted)' } } },
        fill: { opacity: 0.12 },
        stroke: { width: 2 },
        legend: { labels: { colors: 'var(--color-text-secondary)' } },
        tooltip: { theme: 'dark' },
    };

    const trendOptions = {
        chart: { type: 'line', toolbar: { show: false }, background: 'transparent', fontFamily: 'var(--font-sans)' },
        colors: ['#0085db', '#4bd08b', '#fb977d', '#8763da'],
        stroke: { curve: 'smooth', width: [3, 2, 2, 3] },
        dataLabels: { enabled: false },
        xaxis: {
            categories: analytics.trend.map((row) => row.date),
            labels: { style: { colors: 'var(--color-text-muted)' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: [
            { labels: { style: { colors: 'var(--color-text-muted)' } } },
            { opposite: true, labels: { style: { colors: 'var(--color-text-muted)' }, formatter: formatCurrency } },
        ],
        grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 },
        legend: { labels: { colors: 'var(--color-text-secondary)' } },
        tooltip: { theme: 'dark' },
    };

    const trendSeries = [
        { name: 'Tıklama', data: analytics.trend.map((row) => row.clicks), type: 'line' },
        { name: 'Lead', data: analytics.trend.map((row) => row.leads), type: 'line' },
        { name: 'Satış', data: analytics.trend.map((row) => row.sales), type: 'line' },
        { name: 'Gelir', data: analytics.trend.map((row) => row.revenue), type: 'line' },
    ];

    const sourceBarOptions = {
        chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: 'var(--font-sans)' },
        colors: ['#0085db'],
        plotOptions: { bar: { borderRadius: 5, horizontal: true } },
        dataLabels: { enabled: false },
        xaxis: { labels: { style: { colors: 'var(--color-text-muted)' }, formatter: formatCurrency } },
        yaxis: { labels: { style: { colors: 'var(--color-text-muted)' } } },
        grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 },
        tooltip: { theme: 'dark', y: { formatter: formatCurrency } },
    };

    const donutOptions = {
        chart: { type: 'donut', background: 'transparent', fontFamily: 'var(--font-sans)' },
        labels: analytics.event_mix.map((item) => item.label),
        colors: ['#0085db', '#4bd08b', '#fb977d'],
        legend: { position: 'bottom', labels: { colors: 'var(--color-text-secondary)' } },
        dataLabels: { enabled: true },
        stroke: { colors: ['var(--color-bg-secondary)'] },
        tooltip: { theme: 'dark' },
    };

    const detailColumns = [
        { key: 'name', label: 'UTM Linki', sortable: true },
        { key: 'utm_source', label: 'Source', sortable: true },
        { key: 'utm_medium', label: 'Medium', sortable: true },
        { key: 'utm_campaign', label: 'Campaign', sortable: true },
        { key: 'clicks', label: 'Tıklama', sortable: true },
        { key: 'leads', label: 'Lead', sortable: true },
        { key: 'sales', label: 'Satış', sortable: true },
        { key: 'revenue', label: 'Gelir', sortable: true, formatter: formatCurrency },
        { key: 'lead_rate', label: 'Lead Oranı', sortable: true, formatter: formatPercent },
        { key: 'sale_rate', label: 'Satış Oranı', sortable: true, formatter: formatPercent },
        { key: 'last_activity_at', label: 'Son Aktivite', sortable: true, formatter: formatDateTime },
    ];

    const campaignColumns = [
        { key: 'campaign', label: 'UTM Campaign', sortable: true },
        { key: 'clicks', label: 'Tıklama', sortable: true },
        { key: 'leads', label: 'Lead', sortable: true },
        { key: 'sales', label: 'Satış', sortable: true },
        { key: 'revenue', label: 'Gelir', sortable: true, formatter: formatCurrency },
        { key: 'lead_rate', label: 'Lead Oranı', sortable: true, formatter: formatPercent },
        { key: 'sale_rate', label: 'Satış Oranı', sortable: true, formatter: formatPercent },
    ];

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>UTM Analiz Modülü</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', maxWidth: '900px' }}>
                Bu alan mevcut pazarlama ve satış analizlerinden bağımsız çalışır. UTM linkinizi burada üretir, aynı modül içinden test eder ve sadece bu linklerden gelen tıklama, lead ve satışları kendi ekranında analiz edersiniz.
            </p>

            {feedback && (
                <div style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '8px', background: 'rgba(0, 133, 219, 0.08)', border: '1px solid rgba(0, 133, 219, 0.18)', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                    {feedback}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <section style={cardStyle}>
                    <SectionHeader
                        eyebrow="UTM Oluşturucu"
                        title="Yeni takip linki üret"
                        description="Hedef URL, source, medium ve campaign değerlerini girin. Sistem size ayrı bir takip linki oluşturur ve hedef URL'ye UTM parametrelerini otomatik ekler."
                    />

                    {!canManage && (
                        <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                            Görüntüleyici rolüyle bu sayfayı inceleyebilirsiniz; yeni link oluşturma ve test verisi ekleme yetkisi yalnızca yönetim ve pazarlama rollerindedir.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
                        {[
                            ['name', 'Link adı', 'Örn. Yaz İndirimi / Instagram Story'],
                            ['destination_url', 'Hedef URL', 'https://site.com/urun'],
                            ['utm_source', 'UTM Source', 'instagram'],
                            ['utm_medium', 'UTM Medium', 'social'],
                            ['utm_campaign', 'UTM Campaign', 'yaz-indirimi'],
                            ['utm_content', 'UTM Content', 'story-video-1'],
                            ['utm_term', 'UTM Term', 'spor-ayakkabi'],
                        ].map(([key, label, placeholder]) => (
                            <label key={key} style={{ display: 'grid', gap: '6px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{label}</span>
                                <input
                                    value={form[key]}
                                    onChange={(event) => handleChange(key, event.target.value)}
                                    placeholder={placeholder}
                                    disabled={!canManage || createLinkMutation.isPending}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-primary)',
                                        color: 'var(--color-text-primary)',
                                    }}
                                />
                            </label>
                        ))}

                        <label style={{ display: 'grid', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Not</span>
                            <textarea
                                value={form.notes}
                                onChange={(event) => handleChange('notes', event.target.value)}
                                rows={4}
                                disabled={!canManage || createLinkMutation.isPending}
                                placeholder="Bu linkin hangi kullanım senaryosu için üretildiğini not alın."
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-primary)',
                                    resize: 'vertical',
                                }}
                            />
                        </label>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                type="submit"
                                disabled={!canManage || createLinkMutation.isPending}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-accent-primary)',
                                    background: 'var(--color-accent-primary)',
                                    color: '#fff',
                                    cursor: canManage ? 'pointer' : 'not-allowed',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontWeight: 700,
                                }}
                            >
                                <IconPlus size={18} stroke={2} />
                                {createLinkMutation.isPending ? 'Oluşturuluyor...' : 'UTM Linki Oluştur'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm(initialForm)}
                                disabled={createLinkMutation.isPending}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <IconRefresh size={18} stroke={1.8} />
                                Formu Temizle
                            </button>
                        </div>
                    </form>
                </section>

                <section style={cardStyle}>
                    <SectionHeader
                        eyebrow="Canlı Önizleme"
                        title="Takip linki ve test akışı"
                        description="Buradaki linki reklam veya kampanya alanlarında kullanırsınız. Link tıklanınca sistem tıklamayı kaydeder ve hedef URL'ye UTM parametreleri eklenmiş şekilde yönlendirir."
                    />

                    {linkPreview ? (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <ReadonlyLinkField label="Takip linki" value={linkPreview.tracking_url} onCopy={() => copyText(linkPreview.tracking_url)} />
                            <ReadonlyLinkField label="UTM'li hedef URL" value={linkPreview.destination_with_utm} onCopy={() => copyText(linkPreview.destination_with_utm)} />

                            <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Etkinlik endpoint örneği</div>
                                <code style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>
                                    POST {linkPreview.tracking_url}/event
                                </code>
                                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                                    Hedef sitede lead veya satış gerçekleştiğinde bu endpoint adresine `event_type` ve varsa `revenue` göndererek UTM satış analizini bu modülde tutabilirsiniz.
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={() => window.open(linkPreview.tracking_url, '_blank', 'noopener,noreferrer')}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-primary)',
                                        color: 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <IconExternalLink size={18} stroke={1.8} />
                                    Takip Linkini Test Et
                                </button>
                                <button
                                    type="button"
                                    onClick={() => copyText(linkPreview.destination_with_utm)}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-primary)',
                                        color: 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <IconLink size={18} stroke={1.8} />
                                    UTM Hedefini Kopyala
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                            Henüz UTM linki yok. İlk link oluşturulduğunda önizleme burada görünür.
                        </div>
                    )}
                </section>
            </div>

            <div style={{ ...cardStyle, marginBottom: '24px' }}>
                <SectionHeader
                    eyebrow="Test ve Validasyon"
                    title="Sadece UTM modülü için test verisi üret"
                    description="Bu alan diğer analiz tablolarını etkilemez. Tüm test etkinlikleri yalnızca UTM tablolarına yazılır."
                />

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                        value={selectedSimulationId}
                        onChange={(event) => setSelectedSimulationId(event.target.value)}
                        style={{
                            minWidth: '280px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                        }}
                    >
                        {links.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>

                    <button
                        type="button"
                        disabled={!canManage || !selectedSimulationId || simulateMutation.isPending}
                        onClick={() => runSimulation({ clicks: 1 })}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-primary)',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <IconPlayerPlay size={16} stroke={1.8} />
                        1 Test Tıklama
                    </button>

                    <button
                        type="button"
                        disabled={!canManage || !selectedSimulationId || simulateMutation.isPending}
                        onClick={() => runSimulation({ leads: 1 })}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-primary)',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        1 Test Lead
                    </button>

                    <button
                        type="button"
                        disabled={!canManage || !selectedSimulationId || simulateMutation.isPending}
                        onClick={() => runSimulation({ sales: 1, revenue: 1000 })}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-primary)',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        1 Test Satış
                    </button>

                    <button
                        type="button"
                        disabled={!canManage || !selectedSimulationId || simulateMutation.isPending}
                        onClick={() => runSimulation({ clicks: 24, leads: 7, sales: 3, revenue: 9600, spread_days: 10 })}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-accent-primary)',
                            background: 'rgba(0, 133, 219, 0.08)',
                            color: 'var(--color-accent-primary)',
                            cursor: 'pointer',
                            fontWeight: 700,
                        }}
                    >
                        Demo Veri Üret
                    </button>
                </div>
            </div>

            <div style={{ ...cardStyle, marginBottom: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                        UTM Analiz Filtresi
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        Bu filtreler sadece UTM modülünü etkiler; genel dashboard filtreleriyle bağlantılı değildir.
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <select
                        value={days}
                        onChange={(event) => setDays(event.target.value)}
                        style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                        }}
                    >
                        <option value="7">Son 7 gün</option>
                        <option value="30">Son 30 gün</option>
                        <option value="90">Son 90 gün</option>
                        <option value="all">Tüm zamanlar</option>
                    </select>
                    <select
                        value={selectedLinkId}
                        onChange={(event) => setSelectedLinkId(event.target.value)}
                        style={{
                            minWidth: '220px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                        }}
                    >
                        <option value="">Tüm UTM linkleri</option>
                        {links.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Toplam Link" value={analytics.summary.total_links || 0} isLoading={analyticsQuery.isLoading} />
                <KpiCard title="Aktif Link" value={analytics.summary.active_links || 0} isLoading={analyticsQuery.isLoading} />
                <KpiCard title="Toplam Tıklama" value={analytics.summary.clicks || 0} isLoading={analyticsQuery.isLoading} />
                <KpiCard title="Toplam Lead" value={analytics.summary.leads || 0} isLoading={analyticsQuery.isLoading} />
                <KpiCard title="Toplam Satış" value={analytics.summary.sales || 0} isLoading={analyticsQuery.isLoading} />
                <KpiCard title="UTM Geliri" value={analytics.summary.revenue || 0} prefix="TL " isLoading={analyticsQuery.isLoading} />
                <KpiCard title="Lead Oranı" value={analytics.summary.lead_rate || 0} suffix="%" isLoading={analyticsQuery.isLoading} />
                <KpiCard title="Satış Oranı" value={analytics.summary.sale_rate || 0} suffix="%" isLoading={analyticsQuery.isLoading} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <div style={cardStyle}>
                    <SectionHeader title="Günlük UTM Trendleri" description="Tıklama, lead, satış ve gelir akışı sadece UTM modülünden gelir." />
                    <Chart options={trendOptions} series={trendSeries} type="line" height={320} />
                </div>
                <div style={cardStyle}>
                    <SectionHeader title="Source / Medium Gelir Dağılımı" description="En çok gelir getiren UTM kaynak kombinasyonlarını görün." />
                    <Chart
                        options={sourceBarOptions}
                        series={[{
                            name: 'Gelir',
                            data: sourceBreakdownRows.slice(0, 8).map((row) => ({ x: `${row.source} / ${row.medium}`, y: row.revenue })),
                        }]}
                        type="bar"
                        height={320}
                    />
                </div>
                <div style={cardStyle}>
                    <SectionHeader title="Etkinlik Karması" description="Tıklama, lead ve satış hacminin modül içindeki dağılımı." />
                    <Chart
                        options={donutOptions}
                        series={analytics.event_mix.map((item) => item.value)}
                        type="donut"
                        height={320}
                    />
                </div>
            </div>

            <div style={comparisonSectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                            Karşılaştırma Modülü
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>İnteraktif UTM karşılaştırması</h3>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                            İki UTM linki seçin; tıklama, lead, satış, gelir ve oranları yan yana görün.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <select value={selectedComparisonA} onChange={(event) => setSelectedComparisonA(event.target.value)} style={{ minWidth: '240px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                            {selectedLinkOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        <select value={selectedComparisonB} onChange={(event) => setSelectedComparisonB(event.target.value)} style={{ minWidth: '240px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                            {selectedLinkOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                    <DataTable title="Karşılaştırma tablosu" columns={comparisonColumns} data={comparisonMetricRows} exportFileName="utm-karsilastirma.csv" rowsPerPage={8} />
                    <div style={cardStyle}>
                        <SectionHeader title="Performans profili" description="Seçili iki UTM linkinin yoğunluk farkları." />
                        <Chart options={radarOptions} series={radarSeries} type="radar" height={320} />
                    </div>
                </div>
            </div>

            <DataTable
                title="UTM Campaign Performansı"
                columns={campaignColumns}
                data={campaignBreakdownRows}
                exportFileName="utm-campaign-performansi.csv"
                rowsPerPage={8}
                isLoading={analyticsQuery.isLoading}
            />

            <div style={{ height: '24px' }} />

            <section ref={createdLinksRef} style={{ marginBottom: '24px' }}>
                <SectionHeader
                    eyebrow="UTM Link Kütüphanesi"
                    title="Oluşturulan linkler"
                    description="Her linkin kendi metrikleri burada görünür. Durum değişikliği ve kopyalama işlemleri diğer analizlerden tamamen ayrıdır."
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                    {(links || []).map((item) => (
                        <article key={item.id} style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px' }}>{item.name}</h3>
                                    <div style={{ marginTop: '4px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                                        {item.utm_source} / {item.utm_medium} / {item.utm_campaign}
                                    </div>
                                </div>
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '999px',
                                    background: item.is_active ? 'rgba(75, 208, 139, 0.15)' : 'rgba(251, 151, 125, 0.15)',
                                    color: item.is_active ? 'var(--color-accent-success)' : 'var(--color-accent-danger)',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                }}>
                                    {item.is_active ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
                                <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Tıklama</div>
                                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{item.clicks || 0}</div>
                                </div>
                                <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Satış</div>
                                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{item.sales || 0}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={() => copyText(item.tracking_url)}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-primary)',
                                        color: 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <IconCopy size={16} stroke={1.8} />
                                    Takip Linki
                                </button>
                                {canManage && (
                                    <button
                                        type="button"
                                        onClick={() => toggleLinkMutation.mutate({ id: item.id, is_active: !item.is_active })}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-primary)',
                                            color: 'var(--color-text-secondary)',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        {item.is_active ? <IconToggleRight size={18} stroke={1.8} /> : <IconToggleLeft size={18} stroke={1.8} />}
                                        {item.is_active ? 'Pasife Al' : 'Aktifleştir'}
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}
                </div>

                {!isLinksLoading && links.length === 0 && (
                    <div style={{ ...cardStyle, color: 'var(--color-text-muted)', fontSize: '14px' }}>
                        Henüz oluşturulmuş UTM linki bulunmuyor.
                    </div>
                )}
            </section>

            <DataTable
                title="Detaylı UTM Link Performans Tablosu"
                columns={detailColumns}
                data={linkBreakdownRows}
                exportFileName="utm-link-performansi.csv"
                rowsPerPage={10}
                isLoading={analyticsQuery.isLoading}
                enableGrouping
                groupByOptions={['utm_source', 'utm_medium', 'utm_campaign']}
            />

            {analyticsQuery.error && (
                <p style={{ color: 'var(--color-accent-danger)', marginTop: '16px' }}>
                    UTM analizi yüklenirken hata oluştu.
                </p>
            )}

            {createdModalLink && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="UTM linki oluşturuldu"
                    onClick={() => setCreatedModalLink(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1300,
                        background: 'rgba(15, 23, 42, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                    }}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: 'min(620px, 100%)',
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '16px',
                            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.28)',
                            padding: '24px',
                            display: 'grid',
                            gap: '18px',
                        }}
                    >
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                                Link Hazır
                            </div>
                            <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--color-text-primary)' }}>UTM linki oluşturuldu</h2>
                            <p style={{ margin: '8px 0 0', color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                                Link artık kullanıma hazır. Reklam, sosyal medya, e-posta veya kampanya alanlarında bu takip linkini kullanabilirsiniz.
                            </p>
                        </div>

                        <ReadonlyLinkField
                            label="Oluşturulan takip linki"
                            value={createdModalLink.tracking_url}
                            onCopy={() => copyText(createdModalLink.tracking_url)}
                        />

                        <ReadonlyLinkField
                            label="UTM'li hedef URL"
                            value={createdModalLink.destination_with_utm}
                            onCopy={() => copyText(createdModalLink.destination_with_utm)}
                        />

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => copyText(createdModalLink.tracking_url)}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <IconCopy size={18} stroke={1.8} />
                                Linki Kopyala
                            </button>
                            <button
                                type="button"
                                onClick={openCreatedLinksSection}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <IconChartBar size={18} stroke={1.8} />
                                Oluşturulan Linklere Git
                            </button>
                            <button
                                type="button"
                                onClick={() => setCreatedModalLink(null)}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-accent-primary)',
                                    background: 'var(--color-accent-primary)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                }}
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
