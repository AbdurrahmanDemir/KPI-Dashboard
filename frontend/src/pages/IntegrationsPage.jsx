import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export default function IntegrationsPage() {
    const queryClient = useQueryClient();
    const [selectedPlatform, setSelectedPlatform] = useState('google_ads');
    
    // Form state
    const [formData, setFormData] = useState({
        client_id: '',
        client_secret: '',
        developer_token: '',
        account_id: '',
        is_active: true
    });

    const { data: integrations, isLoading } = useQuery({
        queryKey: ['integrations'],
        queryFn: async () => (await api.get('/integrations')).data.data || []
    });

    // Populate form when integrations change or platform changes
    React.useEffect(() => {
        if (integrations) {
            const current = integrations.find(i => i.platform === selectedPlatform);
            if (current) {
                setFormData({
                    client_id: current.client_id || '',
                    client_secret: '', // We don't return this from backend for security, so keep it empty unless they want to change it
                    developer_token: '',
                    account_id: current.account_id || '',
                    is_active: current.is_active
                });
            } else {
                setFormData({
                    client_id: '',
                    client_secret: '',
                    developer_token: '',
                    account_id: '',
                    is_active: true
                });
            }
        }
    }, [integrations, selectedPlatform]);

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            await api.post('/integrations', { platform: selectedPlatform, ...data });
        },
        onSuccess: () => {
            alert('Entegrasyon ayarları kaydedildi.');
            queryClient.invalidateQueries({ queryKey: ['integrations'] });
        },
        onError: () => {
            alert('Entegrasyon kaydedilirken bir hata oluştu.');
        }
    });

    const syncMutation = useMutation({
        mutationFn: async ({ platform, testMode }) => {
            await api.post(`/integrations/${platform}/sync`, { testMode });
        },
        onSuccess: (_, variables) => {
            if (variables.testMode) {
                alert('Test verileri başarıyla üretildi ve veritabanına kaydedildi.');
            } else {
                alert('Veriler API üzerinden başarıyla çekildi ve veritabanına kaydedildi.');
            }
            queryClient.invalidateQueries({ queryKey: ['integrations'] });
        },
        onError: () => {
            alert('Senkronizasyon sırasında hata oluştu.');
        }
    });

    const currentIntegration = integrations?.find(i => i.platform === selectedPlatform);

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>API Entegrasyonları</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Google Ads ve Meta (Facebook) Ads gibi platformlardan verileri otomatik çekmek için API ayarlarınızı yapılandırın.
            </p>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {/* Sol Menü - Platform Seçimi */}
                <div style={{ width: '250px', background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', alignSelf: 'flex-start' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Platformlar</h2>
                    
                    <button 
                        onClick={() => setSelectedPlatform('google_ads')}
                        style={{
                            width: '100%', padding: '12px', textAlign: 'left', borderRadius: '8px', marginBottom: '8px', border: 'none', cursor: 'pointer',
                            background: selectedPlatform === 'google_ads' ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                            color: selectedPlatform === 'google_ads' ? '#2563eb' : 'var(--color-text-primary)',
                            fontWeight: selectedPlatform === 'google_ads' ? 600 : 400
                        }}
                    >
                        Google Ads
                    </button>
                    
                    <button 
                        onClick={() => setSelectedPlatform('meta_ads')}
                        style={{
                            width: '100%', padding: '12px', textAlign: 'left', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: selectedPlatform === 'meta_ads' ? 'rgba(24, 119, 242, 0.1)' : 'transparent',
                            color: selectedPlatform === 'meta_ads' ? '#1877f2' : 'var(--color-text-primary)',
                            fontWeight: selectedPlatform === 'meta_ads' ? 600 : 400
                        }}
                    >
                        Meta Ads
                    </button>
                </div>

                {/* Sağ Alan - Form */}
                <div style={{ flex: 1, minWidth: '300px', background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>
                            {selectedPlatform === 'google_ads' ? 'Google Ads Entegrasyonu' : 'Meta Ads Entegrasyonu'}
                        </h2>
                        {currentIntegration?.is_active && (
                            <button 
                                onClick={() => syncMutation.mutate({ platform: selectedPlatform, testMode: false })}
                                disabled={syncMutation.isPending}
                                style={{
                                    padding: '8px 16px', background: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                {syncMutation.isPending ? 'Senkronize ediliyor...' : 'Şimdi Senkronize Et'}
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <p>Yükleniyor...</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Client ID</label>
                                <input 
                                    value={formData.client_id} 
                                    onChange={e => setFormData({...formData, client_id: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} 
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Client Secret</label>
                                <input 
                                    type="password"
                                    value={formData.client_secret} 
                                    onChange={e => setFormData({...formData, client_secret: e.target.value})}
                                    placeholder={currentIntegration ? 'Değiştirmek için yeni değer girin' : ''}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} 
                                />
                            </div>

                            {selectedPlatform === 'google_ads' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Developer Token</label>
                                    <input 
                                        type="password"
                                        value={formData.developer_token} 
                                        onChange={e => setFormData({...formData, developer_token: e.target.value})}
                                        placeholder={currentIntegration ? 'Değiştirmek için yeni değer girin' : ''}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} 
                                    />
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Account ID / Manager ID</label>
                                <input 
                                    value={formData.account_id} 
                                    onChange={e => setFormData({...formData, account_id: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} 
                                />
                            </div>

                            <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={formData.is_active} 
                                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                                />
                                Entegrasyonu Aktifleştir
                            </label>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button 
                                    onClick={() => saveMutation.mutate(formData)}
                                    disabled={saveMutation.isPending}
                                    style={{
                                        flex: 1, padding: '12px', background: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                                        opacity: saveMutation.isPending ? 0.7 : 1
                                    }}
                                >
                                    {saveMutation.isPending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                                </button>
                                
                                <button 
                                    onClick={() => syncMutation.mutate({ platform: selectedPlatform, testMode: true })}
                                    disabled={syncMutation.isPending}
                                    style={{
                                        flex: 1, padding: '12px', background: 'var(--color-bg-secondary)', color: 'var(--color-accent-primary)', border: '2px solid var(--color-accent-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                                        opacity: syncMutation.isPending ? 0.7 : 1
                                    }}
                                >
                                    {syncMutation.isPending ? 'İşleniyor...' : 'Test Verisi Üret'}
                                </button>
                            </div>

                            {currentIntegration?.last_sync_at && (
                                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                                    Son Senkronizasyon: {new Date(currentIntegration.last_sync_at).toLocaleString('tr-TR')}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
