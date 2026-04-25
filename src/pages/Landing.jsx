import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Heart, Users, ShieldCheck, MapPin, Target, Sparkles, HandHeart, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#faf9f6]">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 md:pt-40 md:pb-28 overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-orange-100/50 blur-3xl opacity-60"></div>
                    <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-3xl opacity-60"></div>
                </div>

                <motion.div 
                    className="container mx-auto max-w-5xl text-center space-y-8"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-medium text-sm mb-4">
                        <MapPin className="h-4 w-4" />
                        <span>Initiative spéciale pour la région de l'Oriental</span>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl text-gray-900 leading-tight">
                        De l'Oriental vers <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                            l'Excellence
                        </span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-lg text-gray-600 sm:text-xl max-w-2xl mx-auto leading-relaxed">
                        De Oujda à Nador, connectons la solidarité marocaine aux ambitions de nos étudiants. 
                        La plateforme transparente qui relie les talents universitaires aux donateurs engagés.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
                        <Link to="/register?role=student">
                            <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all hover:scale-105">
                                Je suis Étudiant <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link to="/register?role=donor">
                            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full border-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 transition-all hover:scale-105 bg-white">
                                <HandHeart className="mr-2 h-5 w-5" /> Je veux soutenir ma région
                            </Button>
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* Impact Banner */}
            <motion.section 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="bg-gray-900 py-12 px-4"
            >
                <div className="container mx-auto max-w-5xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-700">
                        <div className="p-4">
                            <div className="text-4xl font-bold text-orange-400 mb-2">+150</div>
                            <div className="text-gray-300 font-medium">Étudiants de l'UMP inscrits</div>
                        </div>
                        <div className="p-4">
                            <div className="text-4xl font-bold text-blue-400 mb-2">100%</div>
                            <div className="text-gray-300 font-medium">Transparence des dons</div>
                        </div>
                        <div className="p-4">
                            <div className="text-4xl font-bold text-green-400 mb-2">8</div>
                            <div className="text-gray-300 font-medium">Villes de l'Oriental couvertes</div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Features Section */}
            <section className="py-24 px-4 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16 space-y-4"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Comment fonctionne BourseConnect ?</h2>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">Une démarche simplifiée et sécurisée pour garantir que l'aide arrive à ceux qui en ont le plus besoin.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="h-full border border-gray-100 shadow-xl shadow-gray-200/40 bg-white/50 backdrop-blur-sm hover:-translate-y-2 transition-transform duration-300">
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 rotate-3">
                                        <Users className="h-8 w-8 text-blue-600 -rotate-3" />
                                    </div>
                                    <CardTitle className="text-xl">1. Créez votre profil</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center text-gray-600">
                                    <p>
                                        <strong className="text-gray-800">Étudiants de l'Oriental :</strong> Présentez votre parcours, vos ambitions et détaillez vos besoins (logement, transport, frais).<br/><br/>
                                        <strong className="text-gray-800">Donateurs :</strong> Inscrivez-vous pour accéder aux profils vérifiés.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="h-full border border-orange-100 shadow-xl shadow-orange-200/20 bg-orange-50/30 backdrop-blur-sm hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Heart className="w-24 h-24 text-orange-500" /></div>
                                <CardHeader className="text-center pb-2 relative z-10">
                                    <div className="mx-auto w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 border border-orange-200 -rotate-3">
                                        <Target className="h-8 w-8 text-orange-600 rotate-3" />
                                    </div>
                                    <CardTitle className="text-xl">2. Choisissez qui soutenir</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center text-gray-600 relative z-10">
                                    Parcourez les dossiers des étudiants de votre région. Filtrez par filière, ville ou niveau d'étude. Engagez-vous financièrement de manière directe et ciblée.
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="h-full border border-green-100 shadow-xl shadow-green-200/20 bg-green-50/30 backdrop-blur-sm hover:-translate-y-2 transition-transform duration-300">
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 border border-green-200 rotate-3">
                                        <ShieldCheck className="h-8 w-8 text-green-600 -rotate-3" />
                                    </div>
                                    <CardTitle className="text-xl">3. Suivi Transparent</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center text-gray-600">
                                    Suivez l'état d'avancement du dossier en temps réel. De l'analyse jusqu'à la confirmation de réception des fonds par l'étudiant. La confiance avant tout.
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600 skew-y-2 transform origin-bottom-right scale-110 -z-10"></div>
                <div className="container mx-auto px-4 text-center text-white relative z-10">
                    <Sparkles className="w-12 h-12 mx-auto mb-6 text-blue-200" />
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Prêt à faire la différence ?</h2>
                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                        Rejoignez le premier réseau de solidarité étudiante dédié à l'Oriental.
                    </p>
                    <Link to="/register?role=donor">
                        <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-10 py-6 rounded-full shadow-xl hover:scale-105 transition-transform">
                            Devenir Donateur
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Landing;
