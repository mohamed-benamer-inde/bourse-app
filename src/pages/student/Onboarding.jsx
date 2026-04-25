import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import api from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, MapPin, Wallet, FileText, Upload, CheckCircle, ChevronRight, ChevronLeft, Trash2, Plus, AlertCircle, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const STEPS = [
    { id: 1, title: 'Contact', icon: MapPin },
    { id: 2, title: 'Académique', icon: GraduationCap },
    { id: 3, title: 'Social', icon: Wallet },
    { id: 4, title: 'Budget', icon: FileText },
    { id: 5, title: 'Justificatifs', icon: Upload },
    { id: 6, title: 'Validation', icon: CheckCircle }
];

const StudentOnboarding = () => {
    const { user, setUser } = useAuth();
    const { createRequest } = useData();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [profileData, setProfileData] = useState({
        address: user?.address || '',
        phone: user?.phone || '',
        educationLevel: user?.educationLevel || '',
        studyField: user?.studyField || '',
        gradeCurrent: user?.gradeCurrent || '',
        gradeN1: user?.gradeN1 || '',
        gradeN2: user?.gradeN2 || '',
        gradeN3: user?.gradeN3 || '',
        rsuTranche: user?.rsuTranche || '',
        resources: user?.resources || '',
        description: user?.description || ''
    });

    const [needs, setNeeds] = useState([{ category: 'Scolarité', amount: '', description: '' }]);
    const [documents, setDocuments] = useState([]); // { name, url, type }

    const updateProfile = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });

    // Needs handlers
    const addNeed = () => setNeeds([...needs, { category: 'Scolarité', amount: '', description: '' }]);
    const updateNeed = (index, field, value) => {
        const newNeeds = [...needs];
        newNeeds[index][field] = value;
        setNeeds(newNeeds);
    };
    const removeNeed = (index) => {
        const newNeeds = [...needs];
        newNeeds.splice(index, 1);
        setNeeds(newNeeds);
    };
    const totalNeedsAmount = needs.reduce((sum, n) => sum + (Number(n.amount) || 0), 0);

    // Document handlers
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (documents.length >= 5) {
            setError("Vous ne pouvez pas ajouter plus de 5 documents.");
            return;
        }

        if (file.size > 2000000) { // 2MB
            setError("Le fichier est trop volumineux. La taille maximale est de 2 Mo (environ 2 pages PDF).");
            return;
        }

        setError('');
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setDocuments(prev => [...prev, {
                name: file.name,
                url: res.data.filePath,
                type: file.type
            }]);
        } catch (err) {
            console.error("Erreur d'upload", err);
            setError(err.response?.data?.message || "Erreur lors du téléchargement du fichier.");
        } finally {
            setLoading(false);
            e.target.value = null; // Reset input
        }
    };

    const removeDocument = (index) => {
        const newDocs = [...documents];
        newDocs.splice(index, 1);
        setDocuments(newDocs);
    };

    // Navigation
    const nextStep = () => {
        setError('');
        // Validation per step
        if (currentStep === 1 && (!profileData.address || !profileData.phone)) {
            return setError("Veuillez remplir votre adresse et numéro de téléphone.");
        }
        if (currentStep === 2 && (!profileData.educationLevel || !profileData.studyField || !profileData.gradeCurrent)) {
            return setError("Veuillez renseigner votre niveau, filière et moyenne actuelle.");
        }
        if (currentStep === 3 && (!profileData.rsuTranche || !profileData.description)) {
            return setError("La tranche RSU et la lettre de motivation sont obligatoires.");
        }
        if (currentStep === 4 && totalNeedsAmount <= 0) {
            return setError("Veuillez ajouter au moins un besoin financier valide.");
        }
        
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    };
    
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            // 1. Update Profile
            const profileRes = await api.put('/profile', profileData);
            setUser(profileRes.data);

            // 2. Create Request with needs and documents
            const reqRes = await api.post('/requests', {
                amountNeeded: totalNeedsAmount,
                status: 'SUBMITTED',
                needs: needs,
                documents: documents
            });

            if (reqRes.data) {
                // Success! Redirect to Dashboard
                navigate('/student');
            }
        } catch (err) {
            console.error("Error submitting onboarding", err);
            setError(err.response?.data?.message || "Une erreur est survenue lors de la création du dossier.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex flex-col pt-8 pb-16 px-4">
            <div className="max-w-3xl mx-auto w-full space-y-6">
                
                {/* Header & Progress */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-center text-gray-900">Complétez votre dossier</h1>
                    <p className="text-center text-muted-foreground">Plus votre dossier est détaillé, plus vous avez de chances de trouver un donateur.</p>
                    
                    <div className="relative pt-4">
                        <div className="flex justify-between mb-2">
                            {STEPS.map((step) => {
                                const Icon = step.icon;
                                const isActive = currentStep === step.id;
                                const isPassed = currentStep > step.id;
                                return (
                                    <div key={step.id} className="flex flex-col items-center relative z-10">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isActive ? 'bg-blue-600 border-blue-600 text-white' : isPassed ? 'bg-blue-100 border-blue-600 text-blue-600' : 'bg-white border-gray-300 text-gray-400'}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-xs mt-2 hidden sm:block ${isActive ? 'font-bold text-blue-600' : isPassed ? 'text-blue-600' : 'text-gray-400'}`}>{step.title}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Progress Bar Line */}
                        <div className="absolute top-9 left-[5%] right-[5%] h-1 bg-gray-200 -z-0">
                            <div className="h-full bg-blue-600 transition-all duration-500 ease-in-out" style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <Card className="shadow-lg border-none mt-8 overflow-hidden">
                    {error && (
                        <div className="p-4 bg-red-50 border-b border-red-100">
                            <AlertDescription className="text-red-600 font-medium flex items-center"><AlertCircle className="w-4 h-4 mr-2"/> {error}</AlertDescription>
                        </div>
                    )}
                    
                    <CardContent className="p-6 sm:p-10 min-h-[400px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                {/* STEP 1: CONTACT */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-semibold">Vos coordonnées</h2>
                                        <div className="space-y-4">
                                            <div><label className="text-sm font-medium mb-1 block">Adresse complète <span className="text-red-500">*</span></label><Input name="address" value={profileData.address} onChange={updateProfile} placeholder="Quartier, Ville..." /></div>
                                            <div><label className="text-sm font-medium mb-1 block">Téléphone <span className="text-red-500">*</span></label><Input name="phone" value={profileData.phone} onChange={updateProfile} placeholder="06..." /></div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: ACADEMIQUE */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-semibold">Parcours Académique</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Niveau d'études <span className="text-red-500">*</span></label>
                                                <select name="educationLevel" value={profileData.educationLevel} onChange={updateProfile} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                                                    <option value="">Sélectionner...</option>
                                                    <option value="Bac+1">Bac+1</option>
                                                    <option value="Bac+2">Bac+2</option>
                                                    <option value="Bac+3">Bac+3</option>
                                                    <option value="Master">Master</option>
                                                </select>
                                            </div>
                                            <div><label className="text-sm font-medium mb-1 block">Filière / Établissement <span className="text-red-500">*</span></label><Input name="studyField" value={profileData.studyField} onChange={updateProfile} placeholder="Ex: Informatique - UMP Oujda" /></div>
                                            <div><label className="text-sm font-medium mb-1 block">Moyenne actuelle (ou Bac) <span className="text-red-500">*</span></label><Input name="gradeCurrent" type="number" step="0.01" max="20" value={profileData.gradeCurrent} onChange={updateProfile} placeholder="/20" /></div>
                                            <div><label className="text-sm font-medium mb-1 block">Moyenne Année N-1 (Optionnel)</label><Input name="gradeN1" type="number" step="0.01" max="20" value={profileData.gradeN1} onChange={updateProfile} /></div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: SOCIAL */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-semibold">Situation Sociale & Motivation</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Indice RSU <span className="text-red-500">*</span></label>
                                                <select name="rsuTranche" value={profileData.rsuTranche} onChange={updateProfile} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                                                    <option value="">Sélectionner...</option>
                                                    <option value="T1 (Très faible)">T1 (Très faible)</option>
                                                    <option value="T2 (Faible)">T2 (Faible)</option>
                                                    <option value="T3 (Moyen)">T3 (Moyen)</option>
                                                    <option value="T4 (Autre)">T4 (Autre)</option>
                                                </select>
                                            </div>
                                            <div><label className="text-sm font-medium mb-1 block">Ressources familiales estimées / mois</label><Input name="resources" type="number" value={profileData.resources} onChange={updateProfile} placeholder="En Dirhams (DH)" /></div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Lettre de motivation (Pourquoi avez-vous besoin d'aide ?) <span className="text-red-500">*</span></label>
                                            <Textarea name="description" value={profileData.description} onChange={updateProfile} placeholder="Expliquez votre situation, vos ambitions et pourquoi ce financement est crucial pour vous..." className="min-h-[150px]" />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: BUDGET */}
                                {currentStep === 4 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-semibold">Besoins Financiers</h2>
                                            <p className="text-sm text-muted-foreground mt-1">Détaillez vos besoins. Les donateurs aiment savoir précisément ce qu'ils financent.</p>
                                        </div>
                                        
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                            {needs.map((need, index) => (
                                                <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 border rounded-lg">
                                                    <select 
                                                        className="flex h-10 w-full sm:w-1/3 rounded-md border border-input bg-white px-3 py-2 text-sm"
                                                        value={need.category} onChange={(e) => updateNeed(index, 'category', e.target.value)}
                                                    >
                                                        <option value="Scolarité">Frais de scolarité</option>
                                                        <option value="Livres et Matériel">Livres et Matériel</option>
                                                        <option value="Transport">Transport</option>
                                                        <option value="Logement">Logement</option>
                                                        <option value="Autre">Autre</option>
                                                    </select>
                                                    <Input type="number" placeholder="Montant (DH)" value={need.amount} onChange={(e) => updateNeed(index, 'amount', e.target.value)} className="w-full sm:w-32 bg-white" />
                                                    <Input placeholder={need.category === 'Autre' ? "Précisez (obligatoire)" : "Description courte"} value={need.description} onChange={(e) => updateNeed(index, 'description', e.target.value)} className="flex-1 bg-white" />
                                                    <Button variant="ghost" size="icon" onClick={() => removeNeed(index)} disabled={needs.length === 1} className="text-red-500 flex-shrink-0">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button variant="outline" className="w-full border-dashed" onClick={addNeed}><Plus className="h-4 w-4 mr-2" /> Ajouter une dépense</Button>
                                        <div className="flex justify-between items-center p-4 bg-blue-50 text-blue-900 rounded-lg font-bold text-lg">
                                            <span>Montant total demandé :</span>
                                            <span>{totalNeedsAmount} DH</span>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 5: DOCUMENTS */}
                                {currentStep === 5 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-semibold">Justificatifs (Optionnel)</h2>
                                            <p className="text-sm text-muted-foreground mt-1">Vous pouvez ajouter des documents (ex: Relevé de notes, Attestation RSU). Un dossier documenté a beaucoup plus de chances d'être financé.</p>
                                        </div>

                                        <Alert className="bg-blue-50 border-blue-200">
                                            <AlertDescription className="text-blue-800 text-sm">
                                                <strong>Limites :</strong> 5 documents maximum. 2 Mo max par fichier (soit environ 2 pages PDF). Formats acceptés : PDF, JPG, PNG.
                                            </AlertDescription>
                                        </Alert>

                                        {documents.length > 0 && (
                                            <div className="space-y-2">
                                                {documents.map((doc, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="p-2 bg-blue-100 text-blue-600 rounded"><FileText className="w-4 h-4"/></div>
                                                            <span className="text-sm font-medium truncate max-w-[200px]">{doc.name}</span>
                                                        </div>
                                                        <Button variant="ghost" size="sm" onClick={() => removeDocument(idx)} className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-center w-full">
                                            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${documents.length >= 5 ? 'opacity-50 pointer-events-none' : 'border-blue-300'}`}>
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    {loading ? <Activity className="w-8 h-8 text-blue-500 animate-spin mb-2" /> : <Upload className="w-8 h-8 text-blue-500 mb-2" />}
                                                    <p className="text-sm text-gray-500 font-medium">{loading ? 'Téléchargement...' : 'Cliquez pour uploader un fichier'}</p>
                                                </div>
                                                <input type="file" className="hidden" onChange={handleFileUpload} disabled={documents.length >= 5 || loading} accept=".pdf,.jpg,.jpeg,.png" />
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 6: VALIDATION */}
                                {currentStep === 6 && (
                                    <div className="space-y-6 text-center">
                                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle className="w-10 h-10" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-gray-900">Dossier prêt !</h2>
                                        <p className="text-lg text-gray-600 max-w-md mx-auto">
                                            Vous êtes sur le point de soumettre votre demande d'un montant de <strong className="text-blue-600">{totalNeedsAmount} DH</strong>.
                                        </p>
                                        <div className="bg-gray-50 p-4 rounded-xl border text-sm text-left mt-6">
                                            <p className="font-semibold text-gray-800 mb-2">En soumettant ce dossier, vous confirmez que :</p>
                                            <ul className="list-disc list-inside text-gray-600 space-y-1">
                                                <li>Toutes les informations fournies sont exactes et sincères.</li>
                                                <li>Vous vous engagez à répondre aux éventuelles demandes de précisions des donateurs.</li>
                                                <li>Les justificatifs fournis vous appartiennent.</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </CardContent>

                    {/* Footer / Controls */}
                    <CardFooter className="bg-gray-50 p-6 flex justify-between border-t">
                        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1 || loading}>
                            <ChevronLeft className="w-4 h-4 mr-2" /> Retour
                        </Button>
                        
                        {currentStep < STEPS.length ? (
                            <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                                Suivant <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 px-8">
                                {loading ? 'Création en cours...' : 'Soumettre mon dossier'}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default StudentOnboarding;
