
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Heart } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { register } = useAuth();

    const [role, setRole] = useState(searchParams.get('role') || 'student');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        captchaAnswer: ''
    });
    const [captchaData, setCaptchaData] = useState({ image: '', token: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const fetchCaptcha = async () => {
        try {
            // We can't use the api utility here easily because it might have interceptors or base URL issues if not configured perfectly yet, 
            // but let's try to use the fetch API directly or the axios instance if available.
            // Assuming api.js is working correctly.
            const res = await import('@/utils/api').then(m => m.default.get('/auth/captcha'));
            setCaptchaData(res.data);
        } catch (err) {
            console.error("Error fetching captcha", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        const res = await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: role,
            captchaAnswer: formData.captchaAnswer,
            captchaToken: captchaData.token
        });

        if (res.success) {
            if (role === 'donor') {
                // Don't redirect, show success message
                alert("Compte créé avec succès ! Il doit maintenant être validé par un administrateur.");
                navigate('/login');
            } else if (role === 'admin') {
                navigate('/admin'); // Should not happen anymore via UI
            } else {
                navigate('/student');
            }
        } else {
            setError(res.message);
            fetchCaptcha(); // Refresh captcha on error
            setFormData(prev => ({ ...prev, captchaAnswer: '' }));
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-8">
            <Card className="w-full max-w-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Créer un compte</CardTitle>
                    <CardDescription className="text-center">
                        Rejoignez la communauté BourseConnect
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        <button
                            type="button"
                            onClick={() => setRole('student')}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${role === 'student' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent hover:bg-gray-100'}`}
                        >
                            <GraduationCap className="h-6 w-6 mb-1" />
                            <span className="text-xs font-medium">Étudiant</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('donor')}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${role === 'donor' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent hover:bg-gray-100'}`}
                        >
                            <Heart className="h-6 w-6 mb-1" />
                            <span className="text-xs font-medium">Donateur</span>
                        </button>
                    </div>

                    {role === 'donor' && (
                        <Alert className="mb-4 bg-blue-50 border-blue-200">
                            <AlertDescription className="text-blue-800 text-sm">
                                Note : Pour des raisons de sécurité, votre compte donateur devra être validé par un administrateur avant de pouvoir accéder à la plateforme.
                            </AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nom complet</label>
                            <Input name="name" placeholder="Jean Dupont" required onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input name="email" type="email" placeholder="jean@exemple.com" required onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mot de passe</label>
                                <Input name="password" type="password" required onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirmer</label>
                                <Input name="confirmPassword" type="password" required onChange={handleChange} />
                            </div>
                        </div>

                        {/* CAPTCHA Section */}
                        <div className="space-y-2 border p-3 rounded-md bg-gray-50">
                            <label className="text-sm font-medium">Vérification de sécurité</label>
                            <div className="flex items-center gap-4">
                                <div
                                    className="bg-white p-2 rounded border"
                                    dangerouslySetInnerHTML={{ __html: captchaData.image }}
                                />
                                <Button type="button" variant="outline" size="sm" onClick={fetchCaptcha}>
                                    ↻
                                </Button>
                            </div>
                            <Input
                                name="captchaAnswer"
                                placeholder="Recopiez le texte ci-dessus"
                                value={formData.captchaAnswer}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full mt-4">S'inscrire en tant que {role === 'student' ? 'Étudiant' : role === 'donor' ? 'Donateur' : 'Administrateur'}</Button>
                    </form>
                </CardContent>
            </Card >
        </div >
    );
};

export default Register;
