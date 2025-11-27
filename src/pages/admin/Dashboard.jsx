import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Shield, UserPlus } from 'lucide-react';
import api from '@/utils/api';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Error fetching users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleValidateDonor = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/validate`);
            // Update local state
            setUsers(users.map(u => u._id === userId ? { ...u, isValidated: true } : u));
            alert("Donateur validé avec succès !");
        } catch (err) {
            console.error("Error validating donor", err);
            alert("Erreur lors de la validation.");
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/admins', newAdmin);
            alert("Administrateur créé avec succès !");
            setNewAdmin({ name: '', email: '', password: '' });
            fetchUsers();
        } catch (err) {
            console.error("Error creating admin", err);
            alert(err.response?.data?.message || "Erreur lors de la création.");
        }
    };

    const pendingDonors = users.filter(u => u.role === 'donor' && !u.isValidated);
    const allAdmins = users.filter(u => u.role === 'admin' || u.role === 'superadmin');

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Administration</h1>
                <p className="text-muted-foreground">Gérez les utilisateurs et la sécurité de la plateforme.</p>
            </div>

            <Tabs defaultValue="donors">
                <TabsList>
                    <TabsTrigger value="donors">Donateurs en attente ({pendingDonors.length})</TabsTrigger>
                    <TabsTrigger value="admins">Administrateurs</TabsTrigger>
                </TabsList>

                <TabsContent value="donors" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Validation des Donateurs</CardTitle>
                            <CardDescription>Validez les comptes donateurs pour leur donner accès aux dossiers étudiants.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingDonors.length > 0 ? (
                                <div className="space-y-4">
                                    {pendingDonors.map(donor => (
                                        <div key={donor._id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                                            <div>
                                                <h4 className="font-semibold">{donor.name}</h4>
                                                <p className="text-sm text-muted-foreground">{donor.email}</p>
                                                <p className="text-xs text-muted-foreground">Inscrit le {new Date(donor.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <Button onClick={() => handleValidateDonor(donor._id)} className="bg-green-600 hover:bg-green-700">
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Valider
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">Aucun donateur en attente de validation.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="admins" className="space-y-4">
                    {user?.role === 'superadmin' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Créer un nouvel Administrateur</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateAdmin} className="flex gap-4 items-end">
                                    <div className="space-y-2 flex-1">
                                        <label className="text-sm font-medium">Nom</label>
                                        <Input value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} required />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <label className="text-sm font-medium">Email</label>
                                        <Input type="email" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <label className="text-sm font-medium">Mot de passe</label>
                                        <Input type="password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} required />
                                    </div>
                                    <Button type="submit">
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Créer
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Liste des Administrateurs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {allAdmins.map(admin => (
                                    <div key={admin._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <div className="flex items-center gap-3">
                                            <Shield className={`h-5 w-5 ${admin.role === 'superadmin' ? 'text-purple-600' : 'text-blue-600'}`} />
                                            <div>
                                                <span className="font-medium">{admin.name}</span>
                                                <span className="text-xs text-muted-foreground ml-2">({admin.email})</span>
                                            </div>
                                        </div>
                                        <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'}>
                                            {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminDashboard;
