import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/utils/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });
        setLoading(true);

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setStatus({ type: 'success', message: res.data.message || 'Email de réinitialisation envoyé avec succès. Veuillez vérifier votre boîte de réception.' });
        } catch (error) {
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.message || 'Une erreur est survenue lors de l\'envoi de l\'email.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-16 max-w-md">
            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Mot de passe oublié</CardTitle>
                    <CardDescription className="text-center">
                        Entrez votre adresse email pour recevoir un lien de réinitialisation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {status.message && (
                            <div className={`p-3 rounded-md text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {status.message}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="vous@exemple.com"
                                    className="pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link to="/login" className="text-sm text-blue-600 hover:underline flex items-center">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à la connexion
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ForgotPassword;
