import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, CheckCircle, DollarSign, Lock, Eye, Users, TrendingUp, ChevronUp, ChevronDown, Activity } from 'lucide-react';
import { formatCurrency } from '@/config/constants';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/modal';
import api from '@/utils/api';
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

const getStatusLabel = (status) => {
    const labels = {
        'SUBMITTED': 'EN ATTENTE',
        'ANALYZING': 'ANALYSE EN COURS',
        'REQUEST_INFO': 'INFOS DEMANDÉES',
        'INFO_RECEIVED': 'RÉPONSE REÇUE',
        'VALIDATED': 'VALIDE - ATTENTE ÉTUDIANT',
        'ACCEPTED': 'ACCÉPTÉ - ATTENTE PAIEMENT',
        'PAID': 'PAYÉ - ATTENTE RÉCEPTION',
        'CONFIRMED': 'TERMINÉ',
        'PARTIALLY_FUNDED': 'FINANCEMENT PARTIEL'
    };
    return labels[status] || status;
};

const getStatusBadge = (status) => {
    return (
        <Badge style={{ backgroundColor: COLORS[status] || COLORS.DRAFT, color: 'white', border: 'none' }}>
            {getStatusLabel(status)}
        </Badge>
    );
};

const DonorDashboard = () => {
    const { user } = useAuth();
    const { getDonorRequests, updateRequestStatus, loading } = useData();
    const allRequests = getDonorRequests();
    
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    
    // Modals
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requestInfoModalOpen, setRequestInfoModalOpen] = useState(false);
    const [validationModalOpen, setValidationModalOpen] = useState(false);
    const [needsContributions, setNeedsContributions] = useState({});
    const [infoRequestMessage, setInfoRequestMessage] = useState('');
    const [currentRequestForAction, setCurrentRequestForAction] = useState(null);
    const [currentRequestForInfo, setCurrentRequestForInfo] = useState(null);

    // Filter Logic
    const isMyRequest = (req) => req.donor === user?._id || req.donor?._id === user?._id;

    const availableRequests = useMemo(() => {
        return allRequests.filter(req => (req.status === 'SUBMITTED' || req.status === 'PARTIALLY_FUNDED') && !isMyRequest(req))
            .filter(req => 
                searchTerm === '' || 
                req.student?.studyField?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.student?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [allRequests, searchTerm, user]);

    const myTrackedRequests = useMemo(() => {
        let filtered = allRequests.filter(req => isMyRequest(req))
            .filter(req => 
                searchTerm === '' || 
                req.student?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );

        return filtered.sort((a, b) => {
            let valA, valB;
            if (sortConfig.key === 'student.name') {
                valA = a.student?.name?.toLowerCase() || '';
                valB = b.student?.name?.toLowerCase() || '';
            } else if (sortConfig.key === 'amountNeeded') {
                valA = Number(a.amountNeeded) || 0;
                valB = Number(b.amountNeeded) || 0;
            } else {
                valA = a[sortConfig.key];
                valB = b[sortConfig.key];
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allRequests, searchTerm, sortConfig, user]);

    // KPIs
    const kpis = useMemo(() => {
        const myRequests = allRequests.filter(req => isMyRequest(req));
        const paidRequests = myRequests.filter(r => ['PAID', 'CONFIRMED'].includes(r.status));
        const activeRequests = myRequests.filter(r => ['ANALYZING', 'REQUEST_INFO', 'INFO_RECEIVED', 'VALIDATED', 'ACCEPTED'].includes(r.status));
        
        return {
            totalDonated: paidRequests.reduce((acc, req) => acc + (Number(req.amountNeeded) || 0), 0),
            studentsSupported: new Set(paidRequests.map(req => req.student?._id)).size,
            activeCount: activeRequests.length
        };
    }, [allRequests, user]);

    // Actions
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <span className="w-4 h-4 inline-block ml-1 opacity-0 group-hover:opacity-50"><ChevronUp className="w-4 h-4"/></span>;
        return sortConfig.direction === 'asc' ? 
            <ChevronUp className="w-4 h-4 inline-block ml-1 text-blue-600" /> : 
            <ChevronDown className="w-4 h-4 inline-block ml-1 text-blue-600" />;
    };

    const handleOpenRequestInfo = (req) => {
        setCurrentRequestForInfo(req);
        setInfoRequestMessage('');
        setRequestInfoModalOpen(true);
    };

    const handleSubmitInfoRequest = async () => {
        if (!infoRequestMessage.trim()) return;

        await updateRequestStatus(
            currentRequestForInfo._id,
            'REQUEST_INFO',
            user?._id,
            user?.name,
            { message: infoRequestMessage }
        );

        setRequestInfoModalOpen(false);
        setCurrentRequestForInfo(null);
    };

    if (loading && allRequests.length === 0) {
        return <div className="flex justify-center items-center h-screen"><Activity className="animate-spin h-8 w-8 text-blue-600" /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 bg-gray-50/30 min-h-screen">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Espace Donateur</h1>
                <p className="text-muted-foreground mt-2">Découvrez des profils étudiants et suivez l'impact de vos contributions.</p>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
                    <Card className="border-none shadow-md bg-white/60 backdrop-blur-sm hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-4 rounded-xl bg-green-50 text-green-600">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Impact Financier</p>
                                <h3 className="text-2xl font-bold tracking-tight">{formatCurrency(kpis.totalDonated)}</h3>
                                <p className="text-xs text-muted-foreground mt-1">Dons réalisés</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
                    <Card className="border-none shadow-md bg-white/60 backdrop-blur-sm hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Étudiants Soutenus</p>
                                <h3 className="text-2xl font-bold tracking-tight">{kpis.studentsSupported}</h3>
                                <p className="text-xs text-muted-foreground mt-1">Dossiers clôturés</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
                    <Card className="border-none shadow-md bg-white/60 backdrop-blur-sm hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-4 rounded-xl bg-orange-50 text-orange-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">En cours d'étude</p>
                                <h3 className="text-2xl font-bold tracking-tight">{kpis.activeCount}</h3>
                                <p className="text-xs text-muted-foreground mt-1">Dossiers actifs</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Tabs defaultValue="discover" className="space-y-6">
                    <TabsList className="bg-white/50 backdrop-blur p-1 shadow-sm">
                        <TabsTrigger value="discover">Découvrir les profils ({availableRequests.length})</TabsTrigger>
                        <TabsTrigger value="tracked">Mes suivis ({myTrackedRequests.length})</TabsTrigger>
                    </TabsList>

                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input placeholder="Rechercher (nom, filière)..." className="pl-9 bg-white shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>

                    <TabsContent value="discover">
                        {availableRequests.length === 0 ? (
                            <div className="text-center py-12 bg-white/60 backdrop-blur rounded-xl shadow-sm border border-dashed">
                                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-lg text-muted-foreground font-medium">Aucun nouveau dossier disponible pour le moment.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {availableRequests.map((req, idx) => (
                                        <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }} key={req._id}>
                                            <Card className="flex flex-col h-full border-none shadow-md bg-white/90 backdrop-blur hover:shadow-lg transition-all group">
                                                <CardHeader className="pb-3 border-b border-gray-100">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-lg">{req.student?.name || 'Étudiant Anonyme'}</CardTitle>
                                                            <CardDescription className="text-sm">{req.student?.studyField || 'Non spécifié'} - {req.student?.educationLevel}</CardDescription>
                                                        </div>
                                                        {getStatusBadge(req.status)}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="flex-1 py-4 space-y-4">
                                                    <p className="text-sm text-gray-600 line-clamp-3 italic">
                                                        "{req.student?.description || 'Pas de description fournie par l\'étudiant.'}"
                                                    </p>
                                                    <div className="bg-blue-50/50 p-3 rounded-lg space-y-2">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-600">Reste à financer :</span>
                                                            <span className="font-bold text-blue-600">{formatCurrency(req.amountNeeded - (req.alreadyFunded || 0))}</span>
                                                        </div>
                                                        {req.alreadyFunded > 0 && (
                                                            <div className="text-[10px] text-green-600 font-medium text-right">
                                                                {formatCurrency(req.alreadyFunded)} déjà financés par d'autres donateurs
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-center text-sm border-t border-blue-100/50 pt-2">
                                                            <span className="text-gray-600">Situation RSU :</span>
                                                            <span className="font-medium text-gray-900">{req.student?.rsuTranche || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => setSelectedRequest(req)}>
                                                        <Eye className="h-4 w-4 mr-2" /> Aperçu du dossier complet
                                                    </Button>
                                                </CardContent>
                                                <CardFooter className="pt-0">
                                                    <Button 
                                                        className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm" 
                                                        onClick={() => updateRequestStatus(req._id, 'ANALYZING', user?._id, user?.name)}
                                                    >
                                                        <Lock className="h-4 w-4 mr-2" /> Prendre en charge ce dossier
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="tracked">
                        <Card className="border-none shadow-md overflow-hidden bg-white/90 backdrop-blur">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100/50 text-gray-600 font-medium border-b">
                                        <tr>
                                            <th className="p-4 cursor-pointer group hover:bg-gray-200/50 transition-colors" onClick={() => handleSort('student.name')}>
                                                <div className="flex items-center">Étudiant {getSortIcon('student.name')}</div>
                                            </th>
                                            <th className="p-4 cursor-pointer group hover:bg-gray-200/50 transition-colors" onClick={() => handleSort('amountNeeded')}>
                                                <div className="flex items-center">Montant {getSortIcon('amountNeeded')}</div>
                                            </th>
                                            <th className="p-4 cursor-pointer group hover:bg-gray-200/50 transition-colors" onClick={() => handleSort('status')}>
                                                <div className="flex items-center">Statut {getSortIcon('status')}</div>
                                            </th>
                                            <th className="p-4 text-right">Actions rapides</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        <AnimatePresence>
                                            {myTrackedRequests.map(req => (
                                                <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={req._id} className={`transition-colors group ${req.status === 'INFO_RECEIVED' ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}>
                                                    <td className="p-4">
                                                        <div className="font-semibold text-gray-900">{req.student?.name}</div>
                                                        <div className="text-xs text-gray-500">{req.student?.studyField}</div>
                                                    </td>
                                                    <td className="p-4 font-medium text-gray-900">{formatCurrency(req.amountNeeded)}</td>
                                                    <td className="p-4">{getStatusBadge(req.status)}</td>
                                                    <td className="p-4 text-right flex justify-end gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => setSelectedRequest(req)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        
                                                        {(req.status === 'ANALYZING' || req.status === 'INFO_RECEIVED') && (
                                                            <>
                                                                <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleOpenRequestInfo(req)}>
                                                                    Infos
                                                                </Button>
                                                                <Button 
                                                                    variant="default" 
                                                                    size="sm" 
                                                                    className="bg-purple-600 hover:bg-purple-700" 
                                                                    onClick={() => {
                                                                        setCurrentRequestForAction(req);
                                                                        const initialContributions = {};
                                                                        req.needs.forEach(n => {
                                                                            initialContributions[n._id || n.id] = n.amount;
                                                                        });
                                                                        setNeedsContributions(initialContributions);
                                                                        setValidationModalOpen(true);
                                                                    }}
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-1" /> Valider
                                                                </Button>
                                                            </>
                                                        )}
                                                        {req.status === 'ACCEPTED' && (
                                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateRequestStatus(req._id, 'PAID', user?._id, user?.name)}>
                                                                <DollarSign className="h-4 w-4 mr-1" /> Payer
                                                            </Button>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                            {myTrackedRequests.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="p-8 text-center text-muted-foreground">
                                                        Vous ne suivez aucun dossier pour le moment. Allez dans l'onglet "Découvrir" pour commencer.
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>

            {/* MODALS */}
            <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="Dossier Étudiant Complet">
                {selectedRequest && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-gray-100 p-4 rounded-xl border">
                            <div className="font-semibold text-lg">{selectedRequest.student?.name}</div>
                            {getStatusBadge(selectedRequest.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg border-b pb-1 text-gray-700">Informations Personnelles</h3>
                                <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-muted-foreground">Email :</span><span className="col-span-2">{selectedRequest.student?.email}</span>
                                    <span className="text-muted-foreground">Téléphone :</span><span className="col-span-2">{selectedRequest.student?.phone || 'Non renseigné'}</span>
                                    <span className="text-muted-foreground">Ville :</span><span className="col-span-2">{selectedRequest.student?.city || 'Non renseignée'}</span>
                                    <span className="text-muted-foreground">Adresse :</span><span className="col-span-2 italic text-gray-400">{selectedRequest.student?.address}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg border-b pb-1 text-gray-700">Situation Académique</h3>
                                <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-muted-foreground">Niveau :</span><span className="col-span-2 font-medium">{selectedRequest.student?.educationLevel}</span>
                                    <span className="text-muted-foreground">Filière :</span><span className="col-span-2">{selectedRequest.student?.studyField}</span>
                                    <span className="text-muted-foreground">École visée :</span><span className="col-span-2">{selectedRequest.student?.schoolAddress || 'Non renseignée'}</span>
                                    <span className="text-muted-foreground">Moyenne :</span><span className="col-span-2 font-bold text-blue-600">{selectedRequest.student?.gradeCurrent}/20</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg border-b pb-1 text-gray-700">Situation Sociale & Motivation</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100"><span className="text-muted-foreground">Catégorie RSU :</span> <span className="font-bold ml-1">{selectedRequest.student?.rsuTranche}</span></div>
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100"><span className="text-muted-foreground">Ressources :</span> <span className="font-bold ml-1">{formatCurrency(selectedRequest.student?.resources)}</span></div>
                            </div>
                            <p className="bg-gray-50 p-4 rounded-xl text-sm italic border text-gray-700 leading-relaxed">
                                "{selectedRequest.student?.description}"
                            </p>
                        </div>

                        {selectedRequest.needs && selectedRequest.needs.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg border-b pb-1 text-gray-700">Répartition des Besoins Financiers</h3>
                                <div className="bg-white p-1 rounded-xl border shadow-sm">
                                    <ul className="divide-y">
                                        {selectedRequest.needs.map((need, idx) => (
                                            <li key={idx} className="flex justify-between items-center p-3 text-sm hover:bg-gray-50 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-800">{need.category}</span>
                                                    {need.description && <span className="text-xs text-muted-foreground italic">{need.description}</span>}
                                                </div>
                                                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{formatCurrency(need.amount)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex justify-between items-center p-3 bg-gray-100 rounded-b-lg text-sm font-bold border-t">
                                        <span>Total Demandé</span>
                                        <span className="text-lg">{formatCurrency(selectedRequest.amountNeeded)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedRequest.exchanges && selectedRequest.exchanges.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg border-b pb-1 text-gray-700">Échanges</h3>
                                <div className="space-y-3 max-h-[250px] overflow-y-auto bg-gray-50 p-4 rounded-xl border">
                                    {selectedRequest.exchanges.map((ex, idx) => (
                                        <div key={idx} className={`flex flex-col ${ex.from === 'Donateur' ? 'items-end' : 'items-start'}`}>
                                            <div className="text-[10px] text-muted-foreground mb-1 px-1">{ex.from} - {new Date(ex.date || Date.now()).toLocaleString()}</div>
                                            <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-sm ${ex.from === 'Donateur' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'}`}>
                                                {ex.message}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg border-b pb-1 text-gray-700">Pièces Jointes ({selectedRequest.documents?.length || 0})</h3>
                            {selectedRequest.documents && selectedRequest.documents.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {selectedRequest.documents.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm hover:border-blue-300 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-blue-50 p-2 rounded-lg"><Eye className="h-4 w-4 text-blue-600" /></div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm text-gray-800 truncate max-w-[150px]">{doc.name}</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:bg-blue-50">
                                                <a href={doc.url.startsWith('http') ? doc.url : `${api.defaults.baseURL.replace('/api', '')}${doc.url}`} target="_blank" rel="noopener noreferrer">Ouvrir</a>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground bg-gray-50 p-4 rounded-xl text-center italic border border-dashed">Aucun document n'a été fourni par l'étudiant.</p>
                            )}
                        </div>

                        {selectedRequest.fundingHistory && selectedRequest.fundingHistory.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg border-b pb-1 text-gray-700">Historique des financements anonymes</h3>
                                <div className="space-y-2">
                                    {selectedRequest.fundingHistory.map((fund, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-green-50/50 p-3 rounded-xl border border-green-100 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span className="font-medium">Donateur précédent</span>
                                                <span className="text-xs text-muted-foreground">{new Date(fund.date).toLocaleDateString()}</span>
                                            </div>
                                            <span className="font-bold text-green-700">+{formatCurrency(fund.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <Modal isOpen={requestInfoModalOpen} onClose={() => setRequestInfoModalOpen(false)} title="Demander des précisions">
                <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3">
                        <Activity className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-orange-800">Communication officielle</p>
                            <p className="text-xs text-orange-700 mt-1">
                                Utilisez cet espace uniquement pour réclamer des documents manquants ou des précisions sur le besoin financier. Les échanges sont modérés.
                            </p>
                        </div>
                    </div>
                    <Textarea
                        placeholder="Bonjour, merci de fournir le relevé de notes du semestre précédent..."
                        value={infoRequestMessage}
                        onChange={(e) => setInfoRequestMessage(e.target.value)}
                        className="min-h-[120px] resize-none"
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setRequestInfoModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleSubmitInfoRequest} disabled={!infoRequestMessage.trim()} className="bg-blue-600 hover:bg-blue-700">
                            Envoyer le message
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={validationModalOpen} onClose={() => setValidationModalOpen(false)} title="Détail du financement">
                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                        <p className="text-sm text-blue-800">
                            Sélectionnez les besoins que vous souhaitez financer. Vous pouvez financer 100% d'un besoin ou saisir un montant partiel.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {currentRequestForAction?.needs.map((need) => {
                            const needId = need._id || need.id;
                            const currentVal = needsContributions[needId] || 0;
                            return (
                                <div key={needId} className="flex flex-col p-3 border rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                checked={currentVal === need.amount}
                                                onChange={(e) => {
                                                    setNeedsContributions(prev => ({
                                                        ...prev,
                                                        [needId]: e.target.checked ? need.amount : 0
                                                    }));
                                                }}
                                                className="w-4 h-4 rounded text-blue-600"
                                            />
                                            <span className="font-medium text-sm text-gray-800">{need.category}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-500">{formatCurrency(need.amount)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            type="number"
                                            size="sm"
                                            className="h-8 text-xs"
                                            value={currentVal}
                                            onChange={(e) => {
                                                const val = Math.min(need.amount, Math.max(0, Number(e.target.value)));
                                                setNeedsContributions(prev => ({ ...prev, [needId]: val }));
                                            }}
                                            placeholder="Montant..."
                                        />
                                        <span className="text-[10px] text-gray-400">DH</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-900 text-white rounded-xl shadow-inner">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400">Total Engagement</span>
                            <span className="text-xl font-bold">{formatCurrency(Object.values(needsContributions).reduce((a, b) => a + b, 0))}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setValidationModalOpen(false)}>Annuler</Button>
                            <Button 
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={Object.values(needsContributions).reduce((a, b) => a + b, 0) <= 0}
                                onClick={async () => {
                                    const total = Object.values(needsContributions).reduce((a, b) => a + b, 0);
                                    await updateRequestStatus(
                                        currentRequestForAction._id, 
                                        'VALIDATED', 
                                        user?._id, 
                                        user?.name,
                                        { contribution: total }
                                    );
                                    setValidationModalOpen(false);
                                }}
                            >
                                Valider le financement
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DonorDashboard;
