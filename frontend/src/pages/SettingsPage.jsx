import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function SettingsPage() {
    const { user } = useAuthStore();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm: '' });

    const changePasswordMutation = useMutation({
        mutationFn: async () => {
            if (passwords.new_password !== passwords.confirm) throw new Error('Yeni şifreler eşleşmiyor!');
            await api.put('/users/me/password', { 
                old_password: passwords.old_password, 
                new_password: passwords.new_password 
            });
        },
        onSuccess: () => {
            alert('Şifreniz güncellendi.');
            setPasswords({ old_password: '', new_password: '', confirm: '' });
        },
        onError: (err) => alert('Hata: ' + (err.response?.data?.error?.message || err.message))
    });

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.className = newTheme; // theme class toggle
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Profil ve Ayarlar</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
                Kullanıcı bilgilerinizi ve arayüz tercihlerinizi düzenleyin.
            </p>

            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                {/* Sol: Kullanıcı Kartı & Tema */}
                <div style={{ flex: '1 1 300px', background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{user?.name}</h2>
                            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{user?.email}</p>
                            <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                                {user?.role.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Arayüz Tercihi</h3>
                    <button 
                        onClick={toggleTheme}
                        style={{ padding: '8px 16px', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {theme === 'dark' ? '☀️ Açık Tema (Light)' : '🌙 Koyu Tema (Dark)'}
                    </button>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                        *(Tema özelliği tarayıcı üzerinde kaydedilir)*
                    </p>
                </div>

                {/* Sağ: Şifre Değiştir */}
                <div style={{ flex: '1 1 400px', background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Şifre Değiştir</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Mevcut Şifre</label>
                            <input 
                                type="password" value={passwords.old_password} onChange={e => setPasswords({...passwords, old_password: e.target.value})}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Yeni Şifre</label>
                            <input 
                                type="password" value={passwords.new_password} onChange={e => setPasswords({...passwords, new_password: e.target.value})}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Yeni Şifre (Tekrar)</label>
                            <input 
                                type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} 
                            />
                        </div>
                        
                        <button 
                            onClick={changePasswordMutation.mutate}
                            style={{ padding: '12px', background: 'var(--color-accent-primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, marginTop: '8px' }}
                        >
                            Şifreyi Güncelle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
