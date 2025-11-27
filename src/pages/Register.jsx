import React, { useState } from 'react';
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
        confirmPassword: ''
    });
    const [error, setError] = useState('');

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
            role: role
        });

        if (res.success) {
            if (role === 'donor') {
                navigate('/donor');
            } else if (role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/student');
            }
        } else {
            setError(res.message);
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
                    <div className="grid grid-cols-3 gap-2 mb-6">
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
                        <button
                            type="button"
                            onClick={() => setRole('admin')}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${role === 'admin' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent hover:bg-gray-100'}`}
                        >
                            <span className="text-xs font-medium">Admin</span>
                        </button>
                    </div>

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
                        <Button type="submit" className="w-full mt-4">S'inscrire en tant que {role === 'student' ? 'Étudiant' : role === 'donor' ? 'Donateur' : 'Administrateur'}</Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <div className="text-sm text-muted-foreground">
                        Déjà un compte ? <Link to="/login" className="text-blue-600 hover:underline">Se connecter</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Register;
