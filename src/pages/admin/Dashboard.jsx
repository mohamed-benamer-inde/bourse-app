import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Shield, UserPlus, Search, Trash2, Edit, FileText, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import api from '@/utils/api';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modals
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchRequests();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Error fetching users", err);
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await api.get('/admin/requests');
            setRequests(res.data);
        } catch (err) {
            console.error("Error fetching requests", err);
        } finally {
            setLoading(false);
        }
    };

    // --- USER ACTIONS ---

    const handleValidateDonor = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/validate`);
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

    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        try {
            const res = await api.put(`/admin/users/${selectedUser._id}`, selectedUser);
            setUsers(users.map(u => u._id === selectedUser._id ? res.data : u));
            setIsUserModalOpen(false);
            alert("Utilisateur mis à jour");
        } catch (err) {
            console.error("Error updating user", err);
            alert("Erreur mise à jour");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u._id !== userId));
            alert("Utilisateur supprimé");
        } catch (err) {
            console.error("Error deleting user", err);
            alert("Erreur suppression");
        }
    };

    // --- REQUEST ACTIONS ---

    const handleForceStatus = async (newStatus) => {
        if (!selectedRequest) return;
        try {
            const res = await api.put(`/admin/requests/${selectedRequest._id}/status`, { status: newStatus });
            setRequests(requests.map(r => r._id === selectedRequest._id ? res.data : r));
            setSelectedRequest(res.data); // Update modal data
            alert("Statut mis à jour");
        } catch (err) {
            console.error("Error updating status", err);
            alert("Erreur mise à jour statut");
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!selectedRequest || !window.confirm("Supprimer ce document ?")) return;
        try {
            const res = await api.delete(`/admin/requests/${selectedRequest._id}/documents/${docId}`);
            setRequests(requests.map(r => r._id === selectedRequest._id ? res.data : r));
            setSelectedRequest(res.data); // Update modal data
            alert("Document supprimé");
        } catch (err) {
            console.error("Error deleting document", err);
            alert("Erreur suppression document");
        }
    };

    // Filtering
    const filteredRequests = requests.filter(req => {
        const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
        const matchesSearch = searchTerm === '' ||
            req.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.student?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const pendingDonors = users.filter(u => u.role === 'donor' && !u.isValidated);
    const allUsersList = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Administration</h1>
                <p className="text-muted-foreground">Gérez les utilisateurs et les dossiers.</p>
            </div>

            <Tabs defaultValue="requests">
                <TabsList>
                    <TabsTrigger value="requests">Dossiers ({requests.length})</TabsTrigger>
                    <TabsTrigger value="users">Utilisateurs ({users.length})</TabsTrigger>
                    <TabsTrigger value="donors">Validations ({pendingDonors.length})</TabsTrigger>
                    <TabsTrigger value="admins">Admins</TabsTrigger>
                </TabsList>

                <TabsContent value="requests" className="space-y-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher étudiant..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="w-[180px] flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">Tous les statuts</option>
                            <option value="DRAFT">Brouillon</option>
                            <option value="SUBMITTED">Soumis</option>
                            <option value="ANALYZING">En Analyse</option>
                            <option value="VALIDATED">Validé</option>
                            <option value="PAID">Payé</option>
                        </select>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <div className="rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-muted-foreground font-medium">
                                        <tr>
                                            <th className="p-4">Étudiant</th>
                                            <th className="p-4">Montant</th>
                                            <th className="p-4">Statut</th>
                                            <th className="p-4">Donateur</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.map(req => (
                                            <tr key={req._id} className="border-t hover:bg-gray-50">
                                                <td className="p-4">
                                                    <div className="font-medium">{req.student?.name || 'Inconnu'}</div>
                                                    <div className="text-xs text-muted-foreground">{req.student?.email}</div>
                                                </td>
                                                <td className="p-4">{req.amountNeeded} DH</td>
                                                <td className="p-4"><Badge variant="outline">{req.status}</Badge></td>
                                                <td className="p-4">{req.donor?.name || '-'}</td>
                                                <td className="p-4 text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedRequest(req); setIsRequestModalOpen(true); }}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher utilisateur..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <div className="rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-muted-foreground font-medium">
                                        <tr>
                                            <th className="p-4">Nom</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4">Rôle</th>
                                            <th className="p-4">Validé</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allUsersList.map(u => (
                                            <tr key={u._id} className="border-t hover:bg-gray-50">
                                                <td className="p-4 font-medium">{u.name}</td>
                                                <td className="p-4">{u.email}</td>
                                                <td className="p-4"><Badge variant="secondary">{u.role}</Badge></td>
                                                <td className="p-4">
                                                    {u.isValidated ? <CheckCircle className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                                                </td>
                                                <td className="p-4 text-right flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); }}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteUser(u._id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="donors">
                    {/* Existing Donor Validation UI */}
                    <Card>
                        <CardHeader><CardTitle>Validation des Donateurs</CardTitle></CardHeader>
                        <CardContent>
                            {pendingDonors.length > 0 ? (
                                <div className="space-y-4">
                                    {pendingDonors.map(donor => (
                                        <div key={donor._id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                                            <div>
                                                <h4 className="font-semibold">{donor.name}</h4>
                                                <p className="text-sm text-muted-foreground">{donor.email}</p>
                                            </div>
                                            <Button onClick={() => handleValidateDonor(donor._id)} className="bg-green-600 hover:bg-green-700">
                                                <CheckCircle className="h-4 w-4 mr-2" /> Valider
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-center text-muted-foreground py-8">Aucun donateur en attente.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="admins">
                    {/* Existing Admin Creation UI */}
                    {user?.role === 'superadmin' && (
                        <Card className="mb-6">
                            <CardHeader><CardTitle>Créer un Admin</CardTitle></CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateAdmin} className="flex gap-4 items-end">
                                    <Input placeholder="Nom" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} required />
                                    <Input placeholder="Email" type="email" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
                                    <Input placeholder="Mot de passe" type="password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} required />
                                    <Button type="submit"><UserPlus className="h-4 w-4 mr-2" /> Créer</Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                    {/* List Admins */}
                    <Card>
                        <CardContent className="pt-6">
                            {users.filter(u => u.role === 'admin' || u.role === 'superadmin').map(admin => (
                                <div key={admin._id} className="flex items-center justify-between p-3 bg-gray-50 rounded mb-2">
                                    <div className="flex items-center gap-3">
                                        <Shield className={`h-5 w-5 ${admin.role === 'superadmin' ? 'text-purple-600' : 'text-blue-600'}`} />
                                        <div><span className="font-medium">{admin.name}</span> <span className="text-xs text-muted-foreground">({admin.email})</span></div>
                                    </div>
                                    <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'}>{admin.role}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* MODAL EDIT USER */}
            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Modifier Utilisateur">
                {selectedUser && (
                    <div className="space-y-4">
                        <div><label className="text-sm font-medium">Nom</label><Input value={selectedUser.name} onChange={e => setSelectedUser({ ...selectedUser, name: e.target.value })} /></div>
                        <div><label className="text-sm font-medium">Email</label><Input value={selectedUser.email} onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })} /></div>
                        <div>
                            <label className="text-sm font-medium">Rôle</label>
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedUser.role}
                                onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}
                            >
                                <option value="student">Étudiant</option>
                                <option value="donor">Donateur</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <Button onClick={handleUpdateUser} className="w-full">Enregistrer</Button>
                    </div>
                )}
            </Modal>

            {/* MODAL EDIT REQUEST */}
            <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Gérer le Dossier">
                {selectedRequest && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="font-medium border-b pb-1">Forcer le Statut</h3>
                            <div className="flex gap-2 flex-wrap">
                                {['DRAFT', 'SUBMITTED', 'ANALYZING', 'VALIDATED', 'PAID'].map(s => (
                                    <Button key={s} variant={selectedRequest.status === s ? 'default' : 'outline'} size="sm" onClick={() => handleForceStatus(s)}>
                                        {s}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-medium border-b pb-1">Documents</h3>
                            {selectedRequest.documents?.length > 0 ? (
                                <ul className="space-y-2">
                                    {selectedRequest.documents.map(doc => (
                                        <li key={doc._id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                            <span className="text-sm truncate max-w-[200px]">{doc.name}</span>
                                            <div className="flex gap-2">
                                                <a href={`${api.defaults.baseURL.replace('/api', '')}${doc.url}?token=${localStorage.getItem('token')}`} target="_blank" rel="noreferrer" className="text-blue-600 text-xs underline">Voir</a>
                                                <button onClick={() => handleDeleteDocument(doc._id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-muted-foreground">Aucun document.</p>}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminDashboard;
