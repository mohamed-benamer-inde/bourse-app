import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, ShieldCheck, MapPin, Target, Sparkles, HandHeart, ChevronRight, ChevronDown, ArrowRight, Quote, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 py-4">
            <button 
                className="flex justify-between items-center w-full text-left font-medium text-gray-900 hover:text-blue-600 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{question}</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <p className="pt-4 text-gray-600 text-sm leading-relaxed">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Landing = () => {
    const [zakatAmount, setZakatAmount] = useState(2500);

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

    // Mocks pour les dossiers
    const mockRequests = [
        { id: 1, name: "Youssef", city: "Figuig", field: "Médecine", amount: 600, desc: "Besoin d'aide pour le transport mensuel vers Oujda." },
        { id: 2, name: "Fatima", city: "Bouarfa", field: "Classes Prépas", amount: 1200, desc: "Aide pour payer la location d'une chambre près du centre." },
        { id: 3, name: "Karim", city: "Jerada", field: "Ingénierie", amount: 800, desc: "Frais d'inscription et achat de livres spécialisés." }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#faf9f6]">
            {/* Hero Section */}
            <section className="relative pt-24 pb-20 px-4 md:pt-32 md:pb-28 overflow-hidden">
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
                        <span>Soutenons les brillants esprits de nos régions éloignées</span>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl text-gray-900 leading-tight">
                        Ne laissons pas le manque de moyens <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                            briser leurs rêves
                        </span>
                    </motion.h1>

                    <motion.div variants={itemVariants} className="text-lg text-gray-600 sm:text-xl max-w-3xl mx-auto leading-relaxed space-y-4 text-justify sm:text-center">
                        <p>
                            À <strong>Figuig</strong>, <strong>Bouarfa</strong>, <strong>Jerada</strong> ou <strong>Saidia</strong>, des centaines d'étudiants brillants sont contraints d'abandonner leurs études supérieures. Souvent, la cause n'est pas le manque de compétences, mais l'impossibilité de payer une petite chambre à Oujda, un ticket de bus mensuel, ou des frais d'inscription dérisoires.
                        </p>
                        <p className="font-medium text-gray-800">
                            Connectons la solidarité marocaine et la Zakat à ces ambitions brisées. Soyez le mécène qui changera la trajectoire d'une vie.
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
                        <Link to="/register?role=student">
                            <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all hover:scale-105">
                                Je suis Étudiant <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link to="/register?role=donor">
                            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full border-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 transition-all hover:scale-105 bg-white">
                                <HandHeart className="mr-2 h-5 w-5" /> Devenir Mécène
                            </Button>
                        </Link>
                    </motion.div>

                    <motion.div variants={itemVariants} className="pt-10 max-w-2xl mx-auto text-left">
                        <Alert className="bg-blue-50/60 border-blue-200 shadow-sm backdrop-blur-md">
                            <Info className="h-5 w-5 text-blue-600" />
                            <AlertTitle className="text-blue-900 font-bold text-lg">100% Direct, 0% Intermédiaire Financier</AlertTitle>
                            <AlertDescription className="text-blue-800 mt-2 leading-relaxed">
                                <strong>L'argent ne transite jamais par BourseConnect.</strong> Les dons se font <strong>directement</strong> entre le mécène et l'étudiant. Notre rôle exclusif est de sécuriser l'étude des dossiers, de vérifier les justificatifs et de simplifier la mise en relation.
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                </motion.div>
            </section>

            {/* Dossiers Urgents */}
            <section className="py-16 px-4 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
                    <Sparkles className="w-96 h-96" />
                </div>
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ils ont besoin de vous aujourd'hui</h2>
                            <p className="text-gray-400 text-lg">Découvrez quelques dossiers en attente de financement.</p>
                        </div>
                        <Link to="/register?role=donor" className="text-orange-400 hover:text-orange-300 font-medium flex items-center group">
                            Voir tous les dossiers <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {mockRequests.map(req => (
                            <Card key={req.id} className="bg-gray-800 border-gray-700 hover:border-orange-500/50 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-gray-100 text-xl">{req.name}</CardTitle>
                                            <div className="text-orange-400 text-sm font-medium mt-1 flex items-center">
                                                <MapPin className="w-3 h-3 mr-1" /> {req.city} • {req.field}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-400 text-sm mb-6 h-10 line-clamp-2">"{req.desc}"</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Reste à financer</span>
                                            <span className="font-bold text-white">{req.amount} DH</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                                        </div>
                                    </div>
                                    <Link to="/register?role=donor">
                                        <Button className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white border-0">
                                            Soutenir {req.name}
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact / Zakat Calculator */}
            <section className="py-24 px-4 bg-orange-50/50">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">L'Impact de votre Zakat</h2>
                    <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
                        Le Nissab de la Zakat Al Maal varie, mais même le montant minimum peut avoir un impact colossal sur l'avenir d'un étudiant. Calculez ce que votre don peut accomplir.
                    </p>

                    <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-orange-100/50 border border-orange-100">
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Montant de votre don (DH)</label>
                            <div className="flex items-center gap-4">
                                <span className="text-xl font-bold text-gray-400">500</span>
                                <input 
                                    type="range" 
                                    min="500" 
                                    max="10000" 
                                    step="500" 
                                    value={zakatAmount}
                                    onChange={(e) => setZakatAmount(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                                />
                                <span className="text-xl font-bold text-gray-400">10k+</span>
                            </div>
                            <div className="mt-6 text-5xl font-extrabold text-orange-600">{zakatAmount} DH</div>
                        </div>

                        <div className="bg-orange-50 rounded-2xl p-6 text-left flex items-start gap-4">
                            <div className="bg-orange-200 p-3 rounded-full shrink-0">
                                <Target className="w-6 h-6 text-orange-700" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2">Impact Concret :</h3>
                                <p className="text-gray-700">
                                    {zakatAmount < 1500 && "Financement du transport et des fournitures pour un semestre entier. L'étudiant peut se rendre à ses cours sans angoisse financière."}
                                    {zakatAmount >= 1500 && zakatAmount < 5000 && "Financement partiel du logement ou achat d'un ordinateur portable indispensable pour ses études. Vous lui offrez un cadre de travail digne."}
                                    {zakatAmount >= 5000 && "Financement complet d'une année d'études (logement, transport, nourriture). Vous sauvez littéralement la scolarité d'un étudiant."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-4 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Comment fonctionne BourseConnect ?</h2>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">Une démarche transparente pour s'assurer que votre don arrive directement à ceux qui en ont le plus besoin.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="h-full border border-gray-100 shadow-xl shadow-gray-200/40 bg-white/50 hover:-translate-y-2 transition-transform duration-300">
                            <CardHeader className="text-center pb-2">
                                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 rotate-3">
                                    <Users className="h-8 w-8 text-blue-600 -rotate-3" />
                                </div>
                                <CardTitle className="text-xl">1. Inscription</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center text-gray-600">
                                <p>
                                    <strong className="text-gray-800">Étudiants :</strong> Présentez votre parcours, vos ambitions et justifiez vos besoins réels.<br/><br/>
                                    <strong className="text-gray-800">Mécènes :</strong> Inscrivez-vous pour accéder aux profils vérifiés en toute sécurité.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="h-full border border-orange-100 shadow-xl shadow-orange-200/20 bg-orange-50/30 hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden">
                            <CardHeader className="text-center pb-2 relative z-10">
                                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 border border-orange-200 -rotate-3">
                                    <Target className="h-8 w-8 text-orange-600 rotate-3" />
                                </div>
                                <CardTitle className="text-xl">2. Choix du dossier</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center text-gray-600 relative z-10">
                                Parcourez les dossiers des étudiants de votre région. Filtrez par filière ou ville. Engagez-vous financièrement sur un besoin spécifique (logement, frais d'inscription).
                            </CardContent>
                        </Card>

                        <Card className="h-full border border-green-100 shadow-xl shadow-green-200/20 bg-green-50/30 hover:-translate-y-2 transition-transform duration-300">
                            <CardHeader className="text-center pb-2">
                                <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 border border-green-200 rotate-3">
                                    <ShieldCheck className="h-8 w-8 text-green-600 -rotate-3" />
                                </div>
                                <CardTitle className="text-xl">3. Suivi Transparent</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center text-gray-600">
                                Suivez l'état d'avancement du dossier en temps réel. De la prise en charge jusqu'à la confirmation de réception des fonds par l'étudiant. La confiance est totale.
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 px-4 bg-gray-50">
                <div className="container mx-auto max-w-5xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">Ils témoignent de l'impact</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                            <Quote className="absolute top-4 right-4 text-gray-100 w-16 h-16" />
                            <p className="text-gray-600 italic mb-6 relative z-10">
                                "Je venais de Bouarfa et je n'avais pas les moyens de louer à Oujda pour ma première année de Droit. J'allais abandonner, jusqu'à ce qu'un mécène anonyme via BourseConnect prenne en charge mes frais de transport et de livres. Aujourd'hui je passe en 2ème année."
                            </p>
                            <div className="font-bold text-gray-900">Salma, 19 ans</div>
                            <div className="text-sm text-gray-500">Étudiante à l'UMP Oujda</div>
                        </div>
                        <div className="bg-blue-600 p-8 rounded-2xl shadow-md border border-blue-500 text-white relative">
                            <Quote className="absolute top-4 right-4 text-blue-500 w-16 h-16 opacity-50" />
                            <p className="text-blue-50 italic mb-6 relative z-10">
                                "Je voulais que ma Zakat aille directement à quelqu'un qui en a un besoin critique, sans intermédiaires. J'ai pu lire le dossier d'un jeune de Jerada, échanger avec lui sur la plateforme, et financer son matériel informatique."
                            </p>
                            <div className="font-bold">Mécène Anonyme</div>
                            <div className="text-sm text-blue-200">A financé 3 étudiants cette année</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 px-4 bg-white">
                <div className="container mx-auto max-w-3xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">Questions Fréquentes</h2>
                    <div className="space-y-1">
                        <FAQItem 
                            question="Comment les dossiers des étudiants sont-ils vérifiés ?" 
                            answer="Chaque étudiant doit fournir des justificatifs (carte d'étudiant, relevés de notes, justificatifs de situation RSU/familiale). Notre plateforme utilise également une IA pour analyser la cohérence des demandes avant de les proposer aux mécènes." 
                        />
                        <FAQItem 
                            question="Puis-je donner ma Zakat Al Maal via BourseConnect ?" 
                            answer="Absolument. Les étudiants inscrits sur notre plateforme issus de milieux très modestes (zones rurales, orphelins, faible RSU) font partie des ayants droit de la Zakat. Vous avez la liberté de choisir précisément le profil que vous souhaitez soutenir." 
                        />
                        <FAQItem 
                            question="Mon anonymat est-il préservé ?" 
                            answer="Oui. En tant que mécène, votre identité (nom de famille, téléphone, email) n'est jamais dévoilée à l'étudiant. Tous les échanges nécessaires (pour demander un justificatif supplémentaire par exemple) se font de manière modérée directement sur la plateforme." 
                        />
                        <FAQItem 
                            question="L'étudiant reçoit-il l'argent directement ?" 
                            answer="Oui, totalement. L'argent ne transite jamais par BourseConnect. Une fois que vous validez un financement, vous êtes mis en relation avec l'étudiant pour effectuer le don de manière sécurisée (virement bancaire, transfert...). L'étudiant doit ensuite confirmer la réception sur la plateforme pour clôturer le dossier." 
                        />
                        <FAQItem 
                            question="BourseConnect prend-il une commission ?" 
                            answer="Non, absolument aucune. Notre rôle est uniquement social et technologique : vérifier les dossiers, valider la bonne foi des demandes, et mettre en relation mécènes et étudiants. L'intégralité de votre don va à l'étudiant." 
                        />
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
                        Rejoignez le réseau de solidarité qui propulse la jeunesse de l'Oriental.
                    </p>
                    <Link to="/register?role=donor">
                        <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-10 py-6 rounded-full shadow-xl hover:scale-105 transition-transform">
                            Devenir Mécène
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Landing;
