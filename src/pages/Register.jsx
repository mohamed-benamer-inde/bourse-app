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
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-8">
            <Card className="w-full max-w-lg">
                <CardHeader className="space-y-1">
                </AlertDescription>
            </CardFooter>
        </Card >
        </div >
    );
};

export default Register;
