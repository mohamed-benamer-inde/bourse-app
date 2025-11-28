import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, CheckCircle, Clock, DollarSign, Lock, Eye, MessageSquare } from 'lucide-react';
import { formatCurrency } from '@/config/constants';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/modal';
import api from '@/utils/api';

const DonorDashboard = () => {
    const { user } = useAuth();
    const { getDonorRequests, updateRequestStatus } = useData();
    const students = getDonorRequests('donor1');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requestInfoModalOpen, setRequestInfoModalOpen] = useState(false);
    const [infoRequestMessage, setInfoRequestMessage] = useState('');
    const [currentRequestForInfo, setCurrentRequestForInfo] = useState(null);

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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'SUBMITTED': return <Badge className="bg-blue-500">Nouveau</Badge>;
            case 'ANALYZING': return <Badge className="bg-yellow-500">En Analyse</Badge>;
            case 'REQUEST_INFO': return <Badge className="bg-orange-500">Info Demandée</Badge>;
            case 'VALIDATED': return <Badge className="bg-purple-500">Validé</Badge>;
            case 'ACCEPTED': return <Badge className="bg-green-500">Accepté par l'étudiant</Badge>;
            case 'PAID': return <Badge className="bg-green-700">Payé</Badge>;
            case 'CONFIRMED': return <Badge className="bg-green-900">Terminé</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Espace Donateur</h1>
                <p className="text-muted-foreground">Trouvez des étudiants à soutenir et gérez vos dons.</p>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Rechercher par études, nom..."
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((req) => (
                    <Card key={req._id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{req.student?.name || 'Étudiant'}</CardTitle>
                                    <CardDescription>{req.student?.studyField || 'Non spécifié'} - {req.student?.educationLevel}</CardDescription>
                                </div>
                                {getStatusBadge(req.status)}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {req.student?.description || 'Pas de description'}
                            </p>
                            <div className="flex flex-col gap-2 text-sm">
                                <div className="flex items-center font-medium text-blue-600">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    Besoin : {formatCurrency(req.amountNeeded)}
                                </div>
                                {req.student?.rsuScore && (
                                    <div className="text-muted-foreground">
                                        Score RSU : <span className="font-medium text-foreground">{req.student.rsuScore}</span>
                                    </div>
                                )}
                                {req.student?.gradeCurrent && (
                                    <div className="text-muted-foreground">
                                        Moyenne : <span className="font-medium text-foreground">{req.student.gradeCurrent}</span>
                                    </div>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setSelectedRequest(req)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir le dossier complet
                            </Button>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2 pt-0">
                            {req.status === 'SUBMITTED' && (
                                <Button className="w-full" onClick={() => updateRequestStatus(req._id, 'ANALYZING', user?._id, user?.name)}>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Prendre en charge (Analyser)
                                </Button>
                            )}

                            {req.status === 'ANALYZING' && (
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="flex gap-2 w-full">
                                        <Button variant="outline" className="flex-1" onClick={() => updateRequestStatus(req._id, 'SUBMITTED', null, user?.name)}>
                                            Relâcher
                                        </Button>
                                        <Button variant="secondary" className="flex-1" onClick={() => handleOpenRequestInfo(req)}>
                                            Demander infos
                                        </Button>
                                    </div>
                                    <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => updateRequestStatus(req._id, 'VALIDATED', user?._id, user?.name)}>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Valider
                                    </Button>
                                </div>
                            )}

                            {req.status === 'ACCEPTED' && (
                                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => updateRequestStatus(req._id, 'PAID', user?._id, user?.name)}>
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Marquer comme Payé
                                </Button>
                            )}

                            {(req.status === 'VALIDATED' || req.status === 'PAID' || req.status === 'CONFIRMED' || req.status === 'REQUEST_INFO') && (
                                <div className="w-full text-center text-sm text-muted-foreground italic">
                                    {req.status === 'VALIDATED' ? 'En attente acceptation étudiant...' :
                                        req.status === 'PAID' ? 'En attente confirmation réception...' :
                                            req.status === 'REQUEST_INFO' ? 'En attente retour étudiant...' : 'Dossier clôturé'}
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="Dossier Étudiant Complet">
                {selectedRequest && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg border-b pb-1">Informations Personnelles</h3>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <span className="text-muted-foreground">Nom :</span>
                                    <span className="col-span-2 font-medium">{selectedRequest.student.name}</span>
                                    <span className="text-muted-foreground">Email :</span>
                                    <span className="col-span-2">{selectedRequest.student.email}</span>
                                    <span className="text-muted-foreground">Téléphone :</span>
                                    <span className="col-span-2">{selectedRequest.student.phone || 'Non renseigné'}</span>
                                    <span className="text-muted-foreground">Adresse :</span>
                                    <span className="col-span-2">{selectedRequest.student.address}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg border-b pb-1">Situation Académique</h3>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <span className="text-muted-foreground">Niveau :</span>
                                    <span className="col-span-2 font-medium">{selectedRequest.student.educationLevel}</span>
                                    <span className="text-muted-foreground">Filière :</span>
                                    <span className="col-span-2">{selectedRequest.student.studyField}</span>
                                    <span className="text-muted-foreground">Moyenne :</span>
                                    <span className="col-span-2 font-bold text-blue-600">{selectedRequest.student.gradeCurrent}/20</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg border-b pb-1">Situation Sociale</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Score RSU :</span>
                                    <span className="ml-2 font-bold">{selectedRequest.student.rsuScore}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Ressources Mensuelles :</span>
                                    <span className="ml-2 font-bold">{formatCurrency(selectedRequest.student.resources)}</span>
                                </div>
                            </div>
                            <div className="mt-2">
                                <span className="text-muted-foreground block mb-1">Description :</span>
                                <p className="bg-gray-50 p-3 rounded-md text-sm italic">
                                    "{selectedRequest.student.description}"
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg border-b pb-1">Historique des Notes</h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-gray-50 p-2 rounded">
                                    <div className="text-xs text-muted-foreground">Année N-1</div>
                                    <div className="font-medium">{selectedRequest.student.gradeN1 || '-'}</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <div className="text-xs text-muted-foreground">Année N-2</div>
                                    <div className="font-medium">{selectedRequest.student.gradeN2 || '-'}</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <div className="text-xs text-muted-foreground">Année N-3</div>
                                    <div className="font-medium">{selectedRequest.student.gradeN3 || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg border-b pb-1">Documents ({selectedRequest.documents?.length || 0})</h3>
                            {selectedRequest.documents && selectedRequest.documents.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedRequest.documents.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="bg-blue-100 p-2 rounded">
                                                    <Eye className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm truncate max-w-[200px]">{doc.name}</span>
                                                    <span className="text-xs text-muted-foreground">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={`${api.defaults.baseURL.replace('/api', '')}${doc.url}?token=${localStorage.getItem('token')}`} target="_blank" rel="noopener noreferrer">
                                                    Voir
                                                </a>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Aucun document fourni.</p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={requestInfoModalOpen} onClose={() => setRequestInfoModalOpen(false)} title="Demande d'informations complémentaires">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Précisez les informations ou documents manquants que vous souhaitez demander à l'étudiant.
                    </p>
                    <Textarea
                        placeholder="Ex: Il manque le relevé de notes de l'année N-1..."
                        value={infoRequestMessage}
                        onChange={(e) => setInfoRequestMessage(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setRequestInfoModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleSubmitInfoRequest} disabled={!infoRequestMessage.trim()}>Envoyer la demande</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DonorDashboard;
