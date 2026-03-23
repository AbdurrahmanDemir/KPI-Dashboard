import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import DataTable from '../components/ui/DataTable';

export default function UsersPage() {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'viewer' });

    // Kullanıcıları Getir
    const { data: usersData, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/users');
            return res.data.data || [];
        }
    });

    // Kullanıcı Ekleme
    const createUserMutation = useMutation({
        mutationFn: async (userData) => {
            await api.post('/users', userData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            setIsAdding(false);
            setNewUser({ name: '', email: '', password: '', role: 'viewer' });
            alert('Kullanıcı eklendi!');
        },
        onError: (err) => alert('Kullanıcı eklenirken hata: ' + (err.response?.data?.error?.message || err.message))
    });

    // Rol Değiştirme
    const changeRoleMutation = useMutation({
        mutationFn: async ({ id, role }) => {
            await api.put(`/users/${id}/role`, { role });
        },
        onSuccess: () => queryClient.invalidateQueries(['users'])
    });

    const columns = [
        { key: 'name', label: 'Ad Soyad', sortable: true },
        { key: 'email', label: 'E-Posta', sortable: true },
        { 
            key: 'role', 
            label: 'Yetki Rolü', 
            sortable: false,
            formatter: (val, row) => (
                <select 
                    value={val}
                    onChange={(e) => changeRoleMutation.mutate({ id: row.id, role: e.target.value })}
                    style={{ padding: '6px', borderRadius: '4px', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                >
                    <option value="admin">Admin</option>
                    <option value="viewer">Görüntüleyici</option>
                </select>
            )
        },
        { key: 'created_at', label: 'Kayıt Tarihi', formatter: v => new Date(v).toLocaleDateString() }
    ];

    if (isLoading) return <div style={{ padding: '24px' }}>Yükleniyor...</div>;

    return (
        <div style={{ padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Kullanıcı ve Rol Yönetimi</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        Sisteme yeni ekip arkadaşları ekleyin ve yetkilerini (Admin / Viewer) belirleyin.
                    </p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    style={{ padding: '10px 16px', background: 'var(--color-accent-primary)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                    {isAdding ? 'İptal' : '➕ Yeni Kullanıcı Ekle'}
                </button>
            </div>

            {isAdding && (
                <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Ad Soyad</label>
                        <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'white' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>E-Posta</label>
                        <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'white' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Şifre</label>
                        <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'white' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Rol</label>
                        <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'white' }}>
                            <option value="viewer">Görüntüleyici</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button onClick={() => createUserMutation.mutate(newUser)} style={{ padding: '10px 24px', background: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, height: '40px' }}>
                            Kaydet
                        </button>
                    </div>
                </div>
            )}

            <DataTable title="Sistem Kullanıcıları" columns={columns} data={usersData} exportFileName="kullanicilar.csv" />
        </div>
    );
}
