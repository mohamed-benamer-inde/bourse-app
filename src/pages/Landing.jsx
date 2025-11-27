import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Heart, Users, ShieldCheck } from 'lucide-react';

const Landing = () => {
    return (
        <div className="flex flex-col gap-16 pb-16">
            {/* Hero Section */}
            <section className="pt-24 pb-12 px-4 md:pt-32 md:pb-20 text-center space-y-6 bg-gradient-to-b from-blue-50 to-white">
                <div className="container mx-auto max-w-4xl space-y-6">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                        Connecter les <span className="text-blue-600">Ambitions</span> aux <span className="text-blue-600">Ressources</span>
                    </h1>
                    <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                        La plateforme qui permet aux étudiants talentueux de trouver des donateurs pour financer leurs études. Simple, transparent et sécurisé.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                        <Link to="/register?role=student">
                            <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                                Je suis Étudiant
                            </Button>
                        </Link>
                        <Link to="/register?role=donor">
                            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                                Je veux Aider
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche ?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="border-none shadow-lg bg-blue-50/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <CardTitle>Créez votre profil</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-muted-foreground">
                            Étudiants, présentez votre parcours et vos besoins. Donateurs, définissez vos critères de soutien.
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-blue-50/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <Heart className="h-6 w-6 text-blue-600" />
                            </div>
                            <CardTitle>Faites un don</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-muted-foreground">
                            Sélectionnez les profils qui vous touchent et engagez-vous via des promesses de don sécurisées.
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-blue-50/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck className="h-6 w-6 text-blue-600" />
                            </div>
                            <CardTitle>Suivi Transparent</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-muted-foreground">
                            Suivez l'état des demandes et des paiements en temps réel. Validation à chaque étape.
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
};

export default Landing;
