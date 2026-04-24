import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '@/utils/api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (password !== confirmPassword) {
            setStatus({ type: 'error', message: 'Les mots de passe ne correspondent pas.' });
            return;
        }

        if (password.length < 6) {
            setStatus({ type: 'error', message: 'Le mot de passe doit contenir au moins 6 caractères.' });
            return;
        }

        setLoading(true);

        try {
            const res = await api.put(`/auth/reset-password/${token}`, { password });
            setStatus({ type: 'success', message: res.data.message || 'Mot de passe réinitialisé avec succès.' });
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe. Le lien est peut-être expiré.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-16 max-w-md">
            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Nouveau mot de passe</CardTitle>
                    <CardDescription className="text-center">
                        Veuillez entrer votre nouveau mot de passe ci-dessous.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {status.type === 'success' ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <p className="text-green-700 font-medium">{status.message}</p>
                            <p className="text-sm text-gray-500">Redirection vers la page de connexion...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {status.message && (
                                <div className="p-3 rounded-md text-sm bg-red-50 text-red-700 flex items-start">
                                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>{status.message}</span>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none" htmlFor="password">
                                    Nouveau mot de passe
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">
                                    Confirmer le mot de passe
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Enregistrement...' : 'Réinitialiser le mot de passe'}
                            </Button>
                        </form>
                    )}
                </CardContent>
                {!status.type === 'success' && (
                    <CardFooter className="flex justify-center">
                        <Link to="/login" className="text-sm text-blue-600 hover:underline">
                            Annuler et retourner à la connexion
                        </Link>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
};

export default ResetPassword;
