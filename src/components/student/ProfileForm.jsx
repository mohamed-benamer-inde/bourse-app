import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { APP_CONFIG } from '@/config/constants';
import { Upload, FileText, Check, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import api from '@/utils/api';

const ProfileForm = () => {
    const { user, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        address: '',
        phone: '',
        educationLevel: '',
        studyField: '',
        rsuScore: '',
        resources: '',
        description: '',
        gradeCurrent: '',
        gradeN1: '',
        gradeN2: '',
        gradeN3: ''
    });
    const [transcriptFile, setTranscriptFile] = useState(null);
    const [transcriptStatus, setTranscriptStatus] = useState('none'); // none, analyzing, valid, invalid
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                address: user.address || '',
                phone: user.phone || '',
                educationLevel: user.educationLevel || '',
                studyField: user.studyField || '',
                rsuScore: user.rsuScore || '',
                resources: user.resources || '',
                description: user.description || '',
                gradeCurrent: user.gradeCurrent || '',
                gradeN1: user.gradeN1 || '',
                gradeN2: user.gradeN2 || '',
                gradeN3: user.gradeN3 || ''
            });
            if (user.transcriptStatus) {
                setTranscriptStatus(user.transcriptStatus);
            }
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setTranscriptFile(file);
            setTranscriptStatus('analyzing');

            // Upload file
            const formDataUpload = new FormData();
            formDataUpload.append('transcript', file);

            try {
                await api.post('/upload', formDataUpload, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                setTimeout(() => {
                    setTranscriptStatus('valid');
                }, 1500);

            } catch (err) {
                console.error("Upload error", err);
                setTranscriptStatus('invalid');
                setError('Erreur lors de l\'upload du fichier');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const res = await api.put('/profile', {
                ...formData,
                transcriptStatus: transcriptStatus === 'valid' ? 'valid' : user.transcriptStatus
            });

            updateProfile(res.data);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            console.error("Profile update error", err);
            setError('Erreur lors de la mise à jour du profil');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Mon Profil Étudiant</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit} autoComplete="off">
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Adresse</label>
                            <Input name="address" value={formData.address} onChange={handleChange} placeholder="Votre adresse complète" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Téléphone</label>
                            <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="06..." required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Niveau d'études</label>
                            <select
                                name="educationLevel"
                                value={formData.educationLevel}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                required
                            >
                                <option value="">Sélectionner un niveau</option>
                                {APP_CONFIG.educationLevels.map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Filière</label>
                            <select
                                name="studyField"
                                value={formData.studyField}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                required
                            >
                                <option value="">Sélectionner une filière</option>
                                {APP_CONFIG.studyFields.map(field => (
                                    <option key={field} value={field}>{field}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Score RSU</label>
                            <Input name="rsuScore" type="number" step="0.01" value={formData.rsuScore} onChange={handleChange} placeholder="Ex: 9.50" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ressources Mensuelles ({APP_CONFIG.currency.code})</label>
                            <Input name="resources" type="number" value={formData.resources} onChange={handleChange} placeholder="0" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description de votre situation</label>
                        <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Expliquez pourquoi vous avez besoin de cette bourse..." className="h-32" required />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Résultats Académiques</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Moyenne Actuelle</label>
                                <Input name="gradeCurrent" value={formData.gradeCurrent} onChange={handleChange} placeholder="Ex: 14.5" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Moyenne N-1</label>
                                <Input name="gradeN1" value={formData.gradeN1} onChange={handleChange} placeholder="Ex: 13.8" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Moyenne N-2</label>
                                <Input name="gradeN2" value={formData.gradeN2} onChange={handleChange} placeholder="Ex: 14.0" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Moyenne N-3</label>
                                <Input name="gradeN3" value={formData.gradeN3} onChange={handleChange} placeholder="Ex: 15.2" />
                            </div>
                        </div>
                    </div>


                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4">
                    <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            'Enregistrer le profil'
                        )}
                    </Button>
                    {showSuccess && (
                        <div className="flex items-center text-green-600 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Profil mis à jour avec succès !
                        </div>
                    )}
                </CardFooter>
            </form>
        </Card>
    );
};

export default ProfileForm;
