import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Upload, FileText, AlertCircle, CheckCircle, Clock, Search, ShieldCheck, Trash2, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { formatCurrency } from '@/config/constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';

const StudentDashboard = () => {
    const { user } = useAuth();
    const { getStudentRequest, updateRequestStatus, refreshRequests, loading: dataLoading } = useData();
    const navigate = useNavigate();

    const [responseMessage, setResponseMessage] = useState('');
    const [uploadLoading, setUploadLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Get current student request
    const myRequest = getStudentRequest(user?.id || user?._id);

    useEffect(() => {
        if (!dataLoading) {
            // If the student doesn't have a valid request (or it's a DRAFT), redirect to onboarding wizard
            if (!myRequest || !myRequest._id || myRequest.status === 'DRAFT') {
                navigate('/student/onboarding');
            }
        }
    }, [dataLoading, myRequest, navigate]);

    if (dataLoading || !myRequest) {
        return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    const handleSubmitResponse = async () => {
        if (!responseMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const success = await updateRequestStatus(
                myRequest._id,
                'INFO_RECEIVED',
                user?.id || user?._id,
                user?.name,
                { response: responseMessage }
            );

            if (success) {
                setResponseMessage('');
                // alert("Votre réponse a été envoyée avec succès.");
            } else {
                alert("Erreur lors de l'envoi. Votre message contient peut-être des informations non autorisées (téléphone, email) ou l'IA est indisponible.");
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("Une erreur est survenue lors de l'envoi.");
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;
        try {
            await api.delete(`/requests/${myRequest._id}/documents/${docId}`);
            // We use refreshRequests instead of window.location.reload() to avoid white page
            await refreshRequests();
        } catch (err) {
            console.error("Error deleting document", err);
            alert("Erreur lors de la suppression.");
        }
    };

    const handleAddDocument = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (myRequest.documents && myRequest.documents.length >= 5) {
            alert("Limite de 5 documents atteinte.");
            return;
        }

        if (file.size > 2000000) {
            alert("Fichier trop volumineux. Max 2 Mo.");
            return;
        }

        setUploadLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await api.post(`/requests/${myRequest._id}/documents`, {
                name: file.name,
                url: uploadRes.data.filePath,
                type: file.type
            });

            alert("Document ajouté avec succès !\n\nN'oubliez pas d'envoyer un message au donateur (bouton 'Envoyer ma réponse') pour qu'il soit notifié de cet ajout.");
            await refreshRequests(); // Refresh data seamlessly
        } catch (err) {
            console.error("Error adding document", err);
            alert(err.response?.data?.message || "Erreur lors de l'ajout.");
        } finally {
            setUploadLoading(false);
            e.target.value = null;
        }
    };

    const getStatusDetails = (status) => {
        switch (status) {
            case 'SUBMITTED': return { label: 'Soumis', color: 'bg-blue-500', icon: Clock, desc: 'Dossier en attente de prise en charge par un donateur.' };
            case 'ANALYZING': return { label: 'En Analyse', color: 'bg-yellow-500', icon: Search, desc: 'Un donateur étudie actuellement votre dossier.' };
            case 'REQUEST_INFO': return { label: 'Info Demandée', color: 'bg-orange-500', icon: AlertCircle, desc: 'Le donateur a besoin de précisions.' };
            case 'INFO_RECEIVED': return { label: 'Réponse envoyée', color: 'bg-blue-600', icon: Send, desc: 'En attente du retour du donateur.' };
            case 'VALIDATED': return { label: 'Validé', color: 'bg-purple-500', icon: ShieldCheck, desc: 'Félicitations, votre demande est validée !' };
            case 'ACCEPTED': return { label: 'Accepté', color: 'bg-green-500', icon: CheckCircle, desc: 'Vous avez accepté la proposition.' };
            case 'PAID': return { label: 'Payé', color: 'bg-green-700', icon: CheckCircle, desc: 'Les fonds ont été transférés.' };
            case 'CONFIRMED': return { label: 'Clôturé', color: 'bg-green-900', icon: CheckCircle, desc: 'Dossier finalisé avec succès.' };
            default: return { label: 'Inconnu', color: 'bg-gray-500', icon: Clock, desc: '...' };
        }
    };

    const currentStatus = getStatusDetails(myRequest.status);
    const StatusIcon = currentStatus.icon;

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Bonjour, {user?.name}</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-muted-foreground">Suivez l'état d'avancement de votre demande.</p>
                        <Button variant="ghost" size="sm" onClick={() => setIsViewModalOpen(true)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8">
                            <Eye className="h-4 w-4 mr-1" /> Voir mon dossier
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className={`p-3 rounded-full ${currentStatus.color.replace('bg-', 'bg-').replace('500', '100').replace('600', '100').replace('700', '100').replace('900', '100')} ${currentStatus.color.replace('bg-', 'text-')}`}>
                        <StatusIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Statut Actuel</p>
                        <p className={`font-bold text-lg ${currentStatus.color.replace('bg-', 'text-')}`}>{currentStatus.label}</p>
                    </div>
                </div>
            </motion.div>

            {myRequest.status === 'VALIDATED' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Alert className="bg-purple-50 border-purple-200 shadow-sm">
                        <ShieldCheck className="h-5 w-5 text-purple-600" />
                        <AlertTitle className="text-purple-800 text-lg">Bonne nouvelle !</AlertTitle>
                        <AlertDescription className="text-purple-700 mt-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span>Le donateur a validé votre dossier. Vous devez maintenant accepter formellement la proposition pour passer à l'étape de paiement.</span>
                            <Button onClick={() => updateRequestStatus(myRequest._id, 'ACCEPTED', user?.id || user?._id, user?.name)} className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap">
                                J'accepte la proposition
                            </Button>
                        </AlertDescription>
                    </Alert>
                </motion.div>
            )}

            {myRequest.status === 'PAID' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Alert className="bg-green-50 border-green-200 shadow-sm">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <AlertTitle className="text-green-800 text-lg">Paiement effectué</AlertTitle>
                        <AlertDescription className="text-green-700 mt-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span>Le donateur a indiqué avoir procédé au paiement. Si vous avez bien reçu les fonds, merci de le confirmer pour clôturer le dossier.</span>
                            <Button onClick={() => updateRequestStatus(myRequest._id, 'CONFIRMED', user?.id || user?._id, user?.name)} className="bg-green-600 hover:bg-green-700 whitespace-nowrap">
                                Confirmer la réception
                            </Button>
                        </AlertDescription>
                    </Alert>
                </motion.div>
            )}

            {myRequest.status === 'REQUEST_INFO' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Alert className="border-orange-200 bg-orange-50 shadow-sm">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <AlertTitle className="text-orange-800 text-lg">Action requise : Le donateur vous a écrit</AlertTitle>
                        <AlertDescription className="text-orange-700 mt-4 space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm relative">
                                <span className="absolute -top-3 left-4 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded font-bold">Message du donateur</span>
                                {myRequest.exchanges && myRequest.exchanges.length > 0
                                    ? myRequest.exchanges[myRequest.exchanges.length - 1].message
                                    : "Merci de fournir plus de détails."}
                            </div>

                            <div className="space-y-3">
                                <Textarea
                                    placeholder="Écrivez votre réponse ici de manière polie et claire..."
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    className="bg-white min-h-[100px]"
                                />
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <p className="text-xs text-orange-600 font-medium max-w-lg">
                                        Note : Soyez précis dans votre réponse. Vous pouvez également ajouter un document justificatif ci-dessous si cela répond à la demande.
                                    </p>
                                    <Button onClick={handleSubmitResponse} disabled={!responseMessage.trim() || isSending} className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
                                        {isSending ? (
                                            <>
                                                <Activity className="animate-spin h-4 w-4 mr-2" />
                                                Envoi...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" /> Envoyer la réponse
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Timeline */}
                    <Card className="border-none shadow-md overflow-hidden bg-white">
                        <CardHeader className="bg-gray-50/50 border-b">
                            <CardTitle className="text-lg">Historique du dossier</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {myRequest.history && myRequest.history.length > 0 ? (
                                <div className="relative border-l-2 border-blue-100 ml-3 space-y-6">
                                    {myRequest.history.map((event, index) => (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
                                            key={index} className="relative pl-6"
                                        >
                                            <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">{event.action}</span>
                                                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                                    <span>{new Date(event.date).toLocaleDateString()} à {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    <span>•</span>
                                                    <span>Par : {event.user}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center italic py-4">Aucun événement.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Exhanges (if any) */}
                    {myRequest.exchanges && myRequest.exchanges.length > 0 && (
                        <Card className="border-none shadow-md bg-white">
                            <CardHeader className="bg-gray-50/50 border-b">
                                <CardTitle className="text-lg">Messages échangés</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                                {myRequest.exchanges.map((ex, idx) => (
                                    <div key={idx} className={`flex flex-col ${ex.from === 'Étudiant' ? 'items-end' : 'items-start'}`}>
                                        <span className="text-[10px] text-gray-500 mb-1 px-1">{ex.from} - {new Date(ex.date).toLocaleDateString()}</span>
                                        <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-sm ${ex.from === 'Étudiant' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none border'}`}>
                                            {ex.message}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Documents Panel */}
                    <Card className="border-none shadow-md bg-white">
                        <CardHeader className="bg-gray-50/50 border-b pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Vos Documents</CardTitle>
                                <Badge variant="secondary">{myRequest.documents?.length || 0}/5</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {myRequest.documents && myRequest.documents.length > 0 ? (
                                <ul className="space-y-2">
                                    {myRequest.documents.map((doc, idx) => (
                                        <li key={idx} className="flex flex-col p-3 border rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
                                            <div className="flex items-center justify-between gap-2 overflow-hidden mb-1">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                    <a href={doc.url.startsWith('http') ? doc.url : `${api.defaults.baseURL.replace('/api', '')}${doc.url}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-blue-600 truncate">
                                                        {doc.name}
                                                    </a>
                                                </div>
                                                {myRequest.status === 'REQUEST_INFO' && doc._id && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc._id)} className="text-red-500 hover:text-red-700 h-8 w-8 p-0 flex-shrink-0">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground ml-6">
                                                Ajouté le {new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed">
                                    <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-500">Aucun document n'a été fourni.</p>
                                </div>
                            )}

                            {(!myRequest.status || ['SUBMITTED', 'REQUEST_INFO', 'ANALYZING'].includes(myRequest.status)) && (
                                <div className="pt-2">
                                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors ${(myRequest.documents?.length >= 5 || uploadLoading) ? 'opacity-50 pointer-events-none' : 'border-blue-300'}`}>
                                        <div className="flex flex-col items-center justify-center">
                                            {uploadLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mb-1"></div> : <Upload className="w-5 h-5 text-blue-500 mb-1" />}
                                            <p className="text-xs font-medium text-gray-600">{uploadLoading ? 'Envoi...' : 'Ajouter un justificatif'}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">Max 2 Mo</p>
                                        </div>
                                        <input type="file" className="hidden" onChange={handleAddDocument} disabled={myRequest.documents?.length >= 5 || uploadLoading} accept=".pdf,.jpg,.jpeg,.png" />
                                    </label>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Needs Summary */}
                    <Card className="border-none shadow-md bg-white">
                        <CardHeader className="bg-gray-50/50 border-b">
                            <CardTitle className="text-lg">Budget demandé</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="text-3xl font-bold text-blue-600">{formatCurrency(myRequest.amountNeeded)}</div>
                            {myRequest.alreadyFunded > 0 && (
                                <div className="mt-1 text-sm text-green-600 font-medium">
                                    {formatCurrency(myRequest.alreadyFunded)} déjà sécurisés
                                </div>
                            )}
                            <div className="mt-4 mb-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-green-500 transition-all duration-500" 
                                    style={{ width: `${Math.min(100, (myRequest.alreadyFunded / myRequest.amountNeeded) * 100)}%` }}
                                ></div>
                            </div>
                            <ul className="space-y-2 divide-y">
                                {myRequest.needs?.map((need, idx) => (
                                    <li key={idx} className="flex justify-between text-sm py-2">
                                        <span className="text-gray-600">{need.category}</span>
                                        <span className="font-semibold text-gray-900">{need.amount} DH</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* View Dossier Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(null)} title="Récapitulatif de votre Dossier">
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-gray-100 p-4 rounded-xl border">
                        <div className="font-semibold text-lg">{user?.name}</div>
                        <Badge className={`${currentStatus.color} text-white border-none`}>
                            {currentStatus.label}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg border-b pb-1 text-gray-700">Informations Personnelles</h3>
                            <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 p-3 rounded-lg border">
                                <span className="text-muted-foreground">Email :</span><span className="col-span-2">{user?.email}</span>
                                <span className="text-muted-foreground">Téléphone :</span><span className="col-span-2">{user?.phone || 'Non renseigné'}</span>
                                <span className="text-muted-foreground">Adresse :</span><span className="col-span-2">{user?.address}</span>
                                <span className="text-muted-foreground">Ville :</span><span className="col-span-2">{user?.city}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg border-b pb-1 text-gray-700">Situation Académique</h3>
                            <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 p-3 rounded-lg border">
                                <span className="text-muted-foreground">Niveau :</span><span className="col-span-2 font-medium">{user?.educationLevel}</span>
                                <span className="text-muted-foreground">Filière :</span><span className="col-span-2">{user?.studyField}</span>
                                <span className="text-muted-foreground">École visée :</span><span className="col-span-2">{user?.schoolAddress || 'Non renseignée'}</span>
                                <span className="text-muted-foreground">Moyenne :</span><span className="col-span-2 font-bold text-blue-600">{user?.gradeCurrent}/20</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg border-b pb-1 text-gray-700">Situation Sociale & Motivation</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100"><span className="text-muted-foreground">Catégorie RSU :</span> <span className="font-bold ml-1">{user?.rsuTranche}</span></div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100"><span className="text-muted-foreground">Ressources :</span> <span className="font-bold ml-1">{formatCurrency(user?.resources)}</span></div>
                        </div>
                        <p className="bg-gray-50 p-4 rounded-xl text-sm italic border text-gray-700 leading-relaxed">
                            "{user?.description}"
                        </p>
                    </div>

                    {myRequest.needs && myRequest.needs.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg border-b pb-1 text-gray-700">Répartition des Besoins Financiers</h3>
                            <div className="bg-white p-1 rounded-xl border shadow-sm">
                                <ul className="divide-y">
                                    {myRequest.needs.map((need, idx) => (
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
                                    <span className="text-lg">{formatCurrency(myRequest.amountNeeded)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {myRequest.fundingHistory && myRequest.fundingHistory.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg border-b pb-1 text-gray-700">Historique des financements sécurisés</h3>
                            <div className="space-y-2">
                                {myRequest.fundingHistory.map((fund, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-green-50/50 p-3 rounded-xl border border-green-100 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <span className="font-medium text-gray-800">Donateur Anonyme</span>
                                            <span className="text-xs text-muted-foreground">{new Date(fund.date).toLocaleDateString()}</span>
                                        </div>
                                        <span className="font-bold text-green-700">+{formatCurrency(fund.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default StudentDashboard;
