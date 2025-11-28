import React, { useState } from 'react';
import api from '@/utils/api';
import ProfileForm from '@/components/student/ProfileForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Upload, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const StudentDashboard = () => {
    const { user } = useAuth();
    const { getStudentRequest, updateRequestStatus, createRequest } = useData();
    const [responseMessage, setResponseMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Get current student request or create a default one for display
    const myRequest = getStudentRequest(user?.id || user?._id) || { status: 'DRAFT' };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleSubmitResponse = async () => {
        if (!responseMessage.trim()) return;

        // In a real app, we would upload files here and get URLs
        // For demo, we just store file names
        const attachments = selectedFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file) // Temporary local URL
        }));

        await updateRequestStatus(
            myRequest._id,
            'ANALYZING',
            user?.id || user?._id,
            user?.name,
            {
                response: responseMessage
            }
        );

        setResponseMessage('');
        setSelectedFiles([]);
        alert("Réponse envoyée au donateur !");
    };

    const calculateCompletion = (user) => {
        if (!user) return 0;
        const fields = ['name', 'email', 'address', 'phone', 'educationLevel', 'studyField', 'rsuScore', 'resources', 'description', 'gradeCurrent'];
        const filled = fields.filter(field => user[field] && user[field].toString().trim() !== '');
        // Base score on data fields (80% weight)
        let score = (filled.length / fields.length) * 80;

        // Document score (20% weight)
        if (user.transcriptStatus === 'valid') {
            score += 20;
        }

        return Math.round(score);
    };

    const completion = calculateCompletion(user);

    const handleSaveDraft = async (amountFromInput) => {
        try {
            if (myRequest._id) {
                // If already exists, just alert (amount update not implemented yet, but draft is saved)
                alert("Brouillon sauvegardé.");
            } else {
                if (amountFromInput) {
                    const newReq = await createRequest(amountFromInput, 'DRAFT');
                    if (newReq) alert("Brouillon créé ! Vous pouvez maintenant ajouter des documents.");
                    else alert("Erreur lors de la création du brouillon.");
                } else {
                    alert("Veuillez saisir un montant");
                }
            }
        } catch (error) {
            console.error("Error in handleSaveDraft", error);
        }
    };

    const handleSubmitRequest = async (amountFromInput) => {
        // Validation: Check if profile is complete
        if (completion < 80) { // Example threshold, or check specific fields
            alert("Veuillez compléter votre profil avant de soumettre.");
            return;
        }

        try {
            if (myRequest._id) {
                const success = await updateRequestStatus(myRequest._id, 'SUBMITTED', user?.id || user?._id, user?.name || 'Étudiant');
                if (success) alert("Dossier soumis avec succès !");
                else alert("Erreur lors de la soumission.");
            } else {
                if (amountFromInput) {
                    const success = await createRequest(amountFromInput, 'SUBMITTED');
                    if (success) alert("Demande créée et soumise !");
                    else alert("Erreur lors de la création.");
                } else {
                    alert("Veuillez saisir un montant");
                }
            }
        } catch (error) {
            console.error("Error in handleSubmitRequest", error);
            alert("Une erreur est survenue.");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'DRAFT': return <Badge variant="outline">Brouillon</Badge>;
            case 'SUBMITTED': return <Badge className="bg-blue-500">Soumis</Badge>;
            case 'ANALYZING': return <Badge className="bg-yellow-500">En Analyse</Badge>;
            case 'REQUEST_INFO': return <Badge className="bg-orange-500">Info Demandée</Badge>;
            case 'VALIDATED': return <Badge className="bg-purple-500">Validé</Badge>;
            case 'ACCEPTED': return <Badge className="bg-green-500">Accepté</Badge>;
            case 'PAID': return <Badge className="bg-green-700">Payé</Badge>;
            case 'CONFIRMED': return <Badge className="bg-green-900">Confirmé</Badge>;
            default: return <Badge variant="secondary">Inconnu</Badge>;
        }
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.filePath;
    };

    const handleAddDocument = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!myRequest._id) {
            alert("Veuillez d'abord sauvegarder le brouillon avant d'ajouter des documents.");
            return;
        }

        if (myRequest.documents && myRequest.documents.length >= 10) {
            alert("Limite de 10 documents atteinte.");
            return;
        }

        try {
            // 1. Upload file
            const filePath = await uploadFile(file);

            // 2. Add to request
            const res = await api.post(`/requests/${myRequest._id}/documents`, {
                name: file.name,
                url: filePath,
                type: file.type
            });

            // 3. Update local state (reload page or update context would be better, but for now alert)
            alert("Document ajouté avec succès !");
            window.location.reload(); // Simple reload to refresh data
        } catch (err) {
            console.error("Error adding document", err);
            alert(err.response?.data?.message || err.message || "Erreur lors de l'ajout du document.");
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Bonjour, {user?.name || 'Étudiant'}</h1>
                    <p className="text-muted-foreground">Gérez votre profil et suivez vos demandes.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Statut :</span>
                        {getStatusBadge(myRequest.status)}
                    </div>
                    {(!myRequest.status || myRequest.status === 'DRAFT') && (
                        <div className="flex items-center gap-2">
                            {!myRequest._id && (
                                <Input
                                    type="number"
                                    placeholder="Montant (DH)"
                                    className="w-32"
                                    id="amount-input"
                                />
                            )}
                            <Button variant="outline" onClick={() => {
                                const amountInput = document.getElementById('amount-input');
                                const amount = amountInput ? amountInput.value : (myRequest.amountNeeded || null);
                                handleSaveDraft(amount);
                            }}>
                                <FileText className="h-4 w-4 mr-2" />
                                Sauvegarder Brouillon
                            </Button>
                            <Button onClick={() => {
                                const amountInput = document.getElementById('amount-input');
                                const amount = amountInput ? amountInput.value : (myRequest.amountNeeded || null);
                                handleSubmitRequest(amount);
                            }}>
                                <Send className="h-4 w-4 mr-2" />
                                Soumettre
                            </Button>
                        </div>
                    )}
                    {myRequest.status === 'VALIDATED' && (
                        <Button onClick={() => updateRequestStatus(myRequest._id, 'ACCEPTED', user?.id || user?._id, user?.name)} className="bg-purple-600 hover:bg-purple-700">
                            Accepter la proposition
                        </Button>
                    )}
                    {myRequest.status === 'PAID' && (
                        <Button onClick={() => updateRequestStatus(myRequest._id, 'CONFIRMED', user?.id || user?._id, user?.name)} className="bg-green-600 hover:bg-green-700">
                            Confirmer la réception
                        </Button>
                    )}
                </div>
            </div>


            {
                myRequest.status === 'REQUEST_INFO' && (
                    <Alert className="border-orange-200 bg-orange-50">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertTitle className="text-orange-800">Action requise : Demande d'information</AlertTitle>
                        <AlertDescription className="text-orange-700 mt-2">
                            <p className="font-medium mb-2">Le donateur a besoin de précisions :</p>
                            <div className="bg-white p-3 rounded border border-orange-200 mb-4 text-sm">
                                {myRequest.exchanges && myRequest.exchanges.length > 0
                                    ? myRequest.exchanges[myRequest.exchanges.length - 1].message
                                    : "Merci de compléter votre dossier."}
                            </div>

                            <div className="space-y-3 bg-white p-4 rounded border border-orange-200">
                                <h4 className="font-semibold text-sm text-gray-900">Votre réponse :</h4>
                                <Textarea
                                    placeholder="Écrivez votre réponse ici..."
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                />

                                <Button onClick={handleSubmitResponse} disabled={!responseMessage.trim()} className="w-full sm:w-auto">
                                    <Send className="h-4 w-4 mr-2" />
                                    Envoyer la réponse
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )
            }

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <ProfileForm />

                    {/* Documents Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex justify-between items-center">
                                <span>Documents Justificatifs</span>
                                <span className="text-sm font-normal text-muted-foreground">
                                    {myRequest.documents?.length || 0}/10
                                </span>
                            </CardTitle>
                            <CardDescription>
                                Ajoutez ici vos relevés de notes, attestations, etc.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {myRequest.documents && myRequest.documents.length > 0 ? (
                                <ul className="space-y-2">
                                    {myRequest.documents.map((doc, idx) => (
                                        <li key={idx} className="flex items-center justify-between p-2 border rounded bg-gray-50">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                <a href={`${api.defaults.baseURL.replace('/api', '')}${doc.url}?token=${localStorage.getItem('token')}`} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline truncate">
                                                    {doc.name}
                                                </a>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Aucun document ajouté.
                                </p>
                            )}

                            {(!myRequest.status || myRequest.status === 'DRAFT' || myRequest.status === 'REQUEST_INFO' || myRequest.status === 'SUBMITTED') && (
                                <div className="flex items-center gap-2 mt-4">
                                    <Input
                                        type="file"
                                        onChange={handleAddDocument}
                                        className="cursor-pointer"
                                        disabled={myRequest.documents?.length >= 10}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">État du dossier</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span>Profil complété</span>
                                <Badge variant="outline" className={`border-${completion === 100 ? 'green' : 'blue'}-600 text-${completion === 100 ? 'green' : 'blue'}-600`}>{completion}%</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Documents validés</span>
                                <Badge variant="outline" className={`border-${user?.transcriptStatus === 'valid' ? 'green' : 'yellow'}-600 text-${user?.transcriptStatus === 'valid' ? 'green' : 'yellow'}-600`}>
                                    {user?.transcriptStatus === 'valid' ? 'Validé' : user?.transcriptStatus === 'analyzing' ? 'En analyse' : user?.transcriptStatus === 'invalid' ? 'Rejeté' : 'Manquant'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Historique</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {myRequest.history ? (
                                <ul className="space-y-4">
                                    {myRequest.history.map((event, index) => (
                                        <li key={index} className="flex flex-col gap-1 border-l-2 border-muted pl-4 pb-4 last:pb-0">
                                            <span className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()}</span>
                                            <span className="text-sm font-medium">{event.action}</span>
                                            <span className="text-xs text-muted-foreground">par {event.user}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Aucun historique disponible.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
