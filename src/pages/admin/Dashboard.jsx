import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Shield, UserPlus, Search, Trash2, Edit, FileText, X, TrendingUp, Users, DollarSign, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import api from '@/utils/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = {
    DRAFT: '#94a3b8',
    SUBMITTED: '#3b82f6',
    ANALYZING: '#eab308',
    REQUEST_INFO: '#f97316',
    INFO_RECEIVED: '#2563eb',
    VALIDATED: '#a855f7',
    ACCEPTED: '#22c55e',
    PAID: '#15803d',
    CONFIRMED: '#14532d'
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Sorting State
    const [sortRequests, setSortRequests] = useState({ key: 'createdAt', direction: 'desc' });
    const [sortUsers, setSortUsers] = useState({ key: 'name', direction: 'asc' });

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
            setSelectedRequest(res.data);
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
            setSelectedRequest(res.data);
            alert("Document supprimé");
        } catch (err) {
            console.error("Error deleting document", err);
            alert("Erreur suppression document");
        }
    };

    // --- STATISTICS & KPIS ---
    const kpis = useMemo(() => {
        const totalFundsRequested = requests.reduce((acc, req) => acc + (Number(req.amountNeeded) || 0), 0);
        const paidRequests = requests.filter(r => ['PAID', 'CONFIRMED'].includes(r.status));
        const totalFundsPaid = paidRequests.reduce((acc, req) => acc + (Number(req.amountNeeded) || 0), 0);
        const pendingActionRequests = requests.filter(r => ['SUBMITTED', 'INFO_RECEIVED'].includes(r.status));
        
        return {
            totalFundsRequested,
            totalFundsPaid,
            pendingActions: pendingActionRequests.length,
            studentsCount: users.filter(u => u.role === 'student').length,
            donorsCount: users.filter(u => u.role === 'donor').length
        };
    }, [requests, users]);

    // Data for PieChart
    const statusData = useMemo(() => {
        const counts = {};
        requests.forEach(req => {
            const st = req.status || 'DRAFT';
            counts[st] = (counts[st] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    }, [requests]);

    // Data for BarChart (Funds)
    const fundsData = [
        { name: 'Demandés', montant: kpis.totalFundsRequested },
        { name: 'Payés/Confirmés', montant: kpis.totalFundsPaid }
    ];

    // --- SORTING HELPERS ---
    const handleSort = (type, key) => {
        if (type === 'requests') {
            setSortRequests(prev => ({
                key,
                direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
            }));
        } else {
            setSortUsers(prev => ({
                key,
                direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
            }));
        }
    };

    const getSortIcon = (type, key) => {
        const sortState = type === 'requests' ? sortRequests : sortUsers;
        if (sortState.key !== key) return <span className="w-4 h-4 inline-block ml-1 opacity-0 group-hover:opacity-50"><ChevronUp className="w-4 h-4"/></span>;
        return sortState.direction === 'asc' ? 
            <ChevronUp className="w-4 h-4 inline-block ml-1 text-blue-600" /> : 
            <ChevronDown className="w-4 h-4 inline-block ml-1 text-blue-600" />;
    };

    // Filtering & Sorting Requests
    const sortedAndFilteredRequests = useMemo(() => {
        let filtered = requests.filter(req => {
            const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
            const matchesSearch = searchTerm === '' ||
                req.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.student?.email?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });

        return filtered.sort((a, b) => {
            let valA, valB;
            if (sortRequests.key === 'student.name') {
                valA = a.student?.name?.toLowerCase() || '';
                valB = b.student?.name?.toLowerCase() || '';
            } else if (sortRequests.key === 'amountNeeded') {
                valA = Number(a.amountNeeded) || 0;
                valB = Number(b.amountNeeded) || 0;
            } else {
                valA = a[sortRequests.key];
                valB = b[sortRequests.key];
            }

            if (valA < valB) return sortRequests.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortRequests.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [requests, searchTerm, statusFilter, sortRequests]);

    // Filtering & Sorting Users
    const sortedAndFilteredUsers = useMemo(() => {
        let filtered = users.filter(u =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            let valA = a[sortUsers.key];
            let valB = b[sortUsers.key];
            
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortUsers.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortUsers.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [users, searchTerm, sortUsers]);

    const pendingDonors = users.filter(u => u.role === 'donor' && !u.isValidated);

    if (loading) return <div className="flex justify-center items-center h-screen"><Activity className="animate-spin h-8 w-8 text-blue-600" /></div>;

    const kpiCards = [
        { title: "Étudiants Inscrits", value: kpis.studentsCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Donateurs", value: kpis.donorsCount, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
        { title: "Dossiers à Traiter", value: kpis.pendingActions, icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
        { title: "Fonds Distribués", value: `${kpis.totalFundsPaid} DH`, subtitle: `sur ${kpis.totalFundsRequested} DH demandés`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" }
    ];

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 bg-gray-50/30 min-h-screen">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Administration Globale</h1>
                <p className="text-muted-foreground mt-2">Vue d'ensemble et gestion de la plateforme BourseConnect.</p>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((kpi, index) => (
                    <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.5 }}>
                        <Card className="border-none shadow-md bg-white/60 backdrop-blur-sm hover:shadow-lg transition-shadow">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className={`p-4 rounded-xl ${kpi.bg}`}>
                                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                                    <h3 className="text-2xl font-bold tracking-tight">{kpi.value}</h3>
                                    {kpi.subtitle && <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                    <Card className="border-none shadow-md bg-white/80 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-500"/> Répartition des Statuts</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {statusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.DRAFT} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-muted-foreground">Aucun dossier</div>}
                        </CardContent>
                    </Card>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
                    <Card className="border-none shadow-md bg-white/80 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-green-500"/> Flux Financier (DH)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={fundsData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                    <YAxis tickFormatter={(val) => `${val/1000}k`} tickLine={false} axisLine={false} />
                                    <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value) => `${value} DH`} />
                                    <Bar dataKey="montant" radius={[4, 4, 0, 0]}>
                                        {fundsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#22c55e'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Main Tabs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Tabs defaultValue="requests" className="space-y-6">
                    <TabsList className="bg-white/50 backdrop-blur p-1 shadow-sm">
                        <TabsTrigger value="requests">Dossiers ({requests.length})</TabsTrigger>
                        <TabsTrigger value="users">Utilisateurs ({users.length})</TabsTrigger>
                        <TabsTrigger value="donors">Validations Donateurs {pendingDonors.length > 0 && <Badge variant="destructive" className="ml-2 px-1.5 py-0">{pendingDonors.length}</Badge>}</TabsTrigger>
                        <TabsTrigger value="admins">Gestion Admins</TabsTrigger>
                    </TabsList>

                    <TabsContent value="requests" className="space-y-4">
                        <div className="flex gap-4 flex-wrap">
                            <div className="relative flex-1 min-w-[250px]">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input placeholder="Rechercher un étudiant..." className="pl-9 bg-white shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <select className="w-[180px] h-10 rounded-md border border-input bg-white px-3 shadow-sm text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="ALL">Tous les statuts</option>
                                {Object.keys(COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <Card className="border-none shadow-md overflow-hidden bg-white/90 backdrop-blur">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100/50 text-gray-600 font-medium border-b">
                                        <tr>
                                            <th className="p-4 cursor-pointer group hover:bg-gray-200/50 transition-colors" onClick={() => handleSort('requests', 'student.name')}>
                                                <div className="flex items-center">Étudiant {getSortIcon('requests', 'student.name')}</div>
                                            </th>
                                            <th className="p-4 cursor-pointer group hover:bg-gray-200/50 transition-colors" onClick={() => handleSort('requests', 'amountNeeded')}>
                                                <div className="flex items-center">Montant {getSortIcon('requests', 'amountNeeded')}</div>
                                            </th>
                                            <th className="p-4 cursor-pointer group hover:bg-gray-200/50 transition-colors" onClick={() => handleSort('requests', 'status')}>
                                                <div className="flex items-center">Statut {getSortIcon('requests', 'status')}</div>
                                            </th>
                                            <th className="p-4">Donateur</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        <AnimatePresence>
                                            {sortedAndFilteredRequests.map(req => (
                                                <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={req._id} className="hover:bg-blue-50/50 transition-colors group">
                                                    <td className="p-4">
                                                        <div className="font-semibold text-gray-900">{req.student?.name || 'Inconnu'}</div>
                                                        <div className="text-xs text-gray-500">{req.student?.email}</div>
                                                    </td>
                                                    <td className="p-4 font-medium">{req.amountNeeded} DH</td>
                                                    <td className="p-4">
                                                        <Badge style={{ backgroundColor: COLORS[req.status] || COLORS.DRAFT, color: 'white', border: 'none' }}>
                                                            {req.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-gray-600">{req.donor?.name || '-'}</td>
                                                    <td className="p-4 text-right">
                                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setSelectedRequest(req); setIsRequestModalOpen(true); }}>
                                                            <Edit className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="users" className="space-y-4">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input placeholder="Rechercher utilisateur..." className="pl-9 bg-white shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <Card className="border-none shadow-md overflow-hidden bg-white/90 backdrop-blur">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100/50 text-gray-600 font-medium border-b">
                                        <tr>
                                            <th className="p-4 cursor-pointer group hover:bg-gray-200/50 transition-colors" onClick={() => handleSort('users', 'name')}>
                                                <div className="flex items-center">Nom {getSortIcon('users', 'name')}</div>
                                            </th>
                                            <th className="p-4 cursor-pointer group hover:bg-gray-200/50 transition-colors" onClick={() => handleSort('users', 'email')}>
                                                <div className="flex items-center">Email {getSortIcon('users', 'email')}</div>
                                            </th>
                                            <th className="p-4 cursor-pointer group hover:bg-gray-200/50 transition-colors" onClick={() => handleSort('users', 'role')}>
                                                <div className="flex items-center">Rôle {getSortIcon('users', 'role')}</div>
                                            </th>
                                            <th className="p-4 cursor-pointer group hover:bg-gray-200/50 transition-colors" onClick={() => handleSort('users', 'isValidated')}>
                                                <div className="flex items-center">Validé {getSortIcon('users', 'isValidated')}</div>
                                            </th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        <AnimatePresence>
                                            {sortedAndFilteredUsers.map(u => (
                                                <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={u._id} className="hover:bg-blue-50/50 transition-colors group">
                                                    <td className="p-4 font-medium text-gray-900">{u.name}</td>
                                                    <td className="p-4 text-gray-600">{u.email}</td>
                                                    <td className="p-4"><Badge variant="outline" className="bg-white">{u.role}</Badge></td>
                                                    <td className="p-4">
                                                        {u.isValidated ? <CheckCircle className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                                                    </td>
                                                    <td className="p-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); }}>
                                                            <Edit className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="hover:bg-red-100" onClick={() => handleDeleteUser(u._id)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="donors">
                        <Card className="border-none shadow-md bg-white/90 backdrop-blur">
                            <CardHeader><CardTitle className="text-xl">Validation des Donateurs</CardTitle></CardHeader>
                            <CardContent>
                                {pendingDonors.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {pendingDonors.map(donor => (
                                            <motion.div layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={donor._id} className="flex flex-col p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                                <h4 className="font-semibold text-lg">{donor.name}</h4>
                                                <p className="text-sm text-muted-foreground mb-4">{donor.email}</p>
                                                <Button onClick={() => handleValidateDonor(donor._id)} className="mt-auto bg-green-600 hover:bg-green-700">
                                                    <CheckCircle className="h-4 w-4 mr-2" /> Valider l'accès
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <CheckCircle className="h-12 w-12 text-green-200 mx-auto mb-4" />
                                        <p className="text-lg text-muted-foreground font-medium">Tous les donateurs sont validés.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="admins">
                        {user?.role === 'superadmin' && (
                            <Card className="mb-6 border-none shadow-md bg-white/90 backdrop-blur">
                                <CardHeader><CardTitle>Ajouter un Administrateur</CardTitle></CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateAdmin} className="flex flex-col sm:flex-row gap-4 items-end">
                                        <div className="w-full"><label className="text-sm font-medium mb-1 block">Nom</label><Input value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} required /></div>
                                        <div className="w-full"><label className="text-sm font-medium mb-1 block">Email</label><Input type="email" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} required /></div>
                                        <div className="w-full"><label className="text-sm font-medium mb-1 block">Mot de passe</label><Input type="password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} required /></div>
                                        <Button type="submit" className="w-full sm:w-auto"><UserPlus className="h-4 w-4 mr-2" /> Créer</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                        <Card className="border-none shadow-md bg-white/90 backdrop-blur">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {users.filter(u => u.role === 'admin' || u.role === 'superadmin').map(admin => (
                                        <div key={admin._id} className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${admin.role === 'superadmin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    <Shield className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{admin.name}</div>
                                                    <div className="text-sm text-muted-foreground">{admin.email}</div>
                                                </div>
                                            </div>
                                            <Badge variant={admin.role === 'superadmin' ? 'default' : 'outline'}>{admin.role}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>

            {/* MODAL EDIT USER */}
            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Modifier Utilisateur">
                {selectedUser && (
                    <div className="space-y-4">
                        <div><label className="text-sm font-medium">Nom</label><Input value={selectedUser.name} onChange={e => setSelectedUser({ ...selectedUser, name: e.target.value })} /></div>
                        <div><label className="text-sm font-medium">Email</label><Input value={selectedUser.email} onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })} /></div>
                        <div>
                            <label className="text-sm font-medium">Rôle</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedUser.role}
                                onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}
                            >
                                <option value="student">Étudiant</option>
                                <option value="donor">Donateur</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <Button onClick={handleUpdateUser} className="w-full">Enregistrer les modifications</Button>
                    </div>
                )}
            </Modal>

            {/* MODAL EDIT REQUEST */}
            <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Gestion du Dossier">
                {selectedRequest && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2">Changer le statut manuellement</h3>
                            <div className="flex gap-2 flex-wrap">
                                {Object.keys(COLORS).map(s => (
                                    <Button key={s} variant={selectedRequest.status === s ? 'default' : 'outline'} size="sm" 
                                        onClick={() => handleForceStatus(s)}
                                        style={selectedRequest.status === s ? {backgroundColor: COLORS[s], color: 'white', borderColor: COLORS[s]} : {borderColor: COLORS[s], color: COLORS[s]}}
                                        className="transition-colors"
                                    >
                                        {s}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold mb-3 border-b pb-2">Documents fournis</h3>
                            {selectedRequest.documents?.length > 0 ? (
                                <ul className="space-y-2">
                                    {selectedRequest.documents.map(doc => (
                                        <li key={doc._id} className="flex justify-between items-center bg-white border p-3 rounded-lg shadow-sm">
                                            <span className="text-sm font-medium truncate max-w-[200px]">{doc.name}</span>
                                            <div className="flex gap-2">
                                                {/* Assuming document route requires cookies now, open in new tab might work if browser sends cookies, otherwise needs proper blob fetch */}
                                                <Button variant="outline" size="sm" asChild>
                                                    <a href={doc.url.startsWith('http') ? doc.url : `${api.defaults.baseURL.replace('/api', '')}${doc.url}`} target="_blank" rel="noreferrer">Ouvrir</a>
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDeleteDocument(doc._id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-muted-foreground italic">L'étudiant n'a envoyé aucun document.</p>}
                        </div>
                        
                        {selectedRequest.exchanges && selectedRequest.exchanges.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-3 border-b pb-2 text-orange-600 flex items-center"><Activity className="w-4 h-4 mr-2"/> Historique de Modération</h3>
                                <div className="space-y-3 max-h-[200px] overflow-y-auto bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                                    {selectedRequest.exchanges.map((ex, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded shadow-sm border border-orange-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-sm">{ex.from}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(ex.date).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-700">{ex.message}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminDashboard;
