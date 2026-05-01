import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import useIdleTimeout from '@/hooks/useIdleTimeout';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleIdle = () => {
        if (user) {
            logout();
            navigate('/login', { state: { message: "Vous avez été déconnecté pour inactivité." } });
        }
    };

    useIdleTimeout(handleIdle, 15 * 60 * 1000); // 15 minutes

    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-900">
            <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2">
                        <GraduationCap className="h-8 w-8 text-blue-600" />
                        <span className="font-bold text-xl hidden sm:inline-block">BourseConnect</span>
                    </Link>

                    <nav className="flex items-center gap-3">
                        <Link to="/login" className="text-sm font-medium hover:underline underline-offset-4 text-gray-600 hidden sm:block">
                            Connexion
                        </Link>
                        <div className="h-4 w-px bg-gray-300 hidden sm:block mx-2"></div>
                        <Link to="/register?role=student">
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                                Je suis Étudiant
                            </Button>
                        </Link>
                        <Link to="/register?role=donor">
                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-transform hover:scale-105">
                                Devenir Mécène
                            </Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="bg-gray-50 border-t pt-12 pb-8">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <GraduationCap className="h-6 w-6 text-blue-600" />
                                <span className="font-bold text-lg">BourseConnect</span>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Connecter la solidarité marocaine aux ambitions de nos étudiants, de l'Oriental à tout le Maroc.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">À propos</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-blue-600">Notre mission</a></li>
                                <li><a href="#" className="hover:text-blue-600">Comment ça marche</a></li>
                                <li><a href="#" className="hover:text-blue-600">Témoignages</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Mécènes & Zakat</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-blue-600">Guide du don</a></li>
                                <li><a href="#" className="hover:text-blue-600">Calcul du Nissab</a></li>
                                <li><a href="#" className="hover:text-blue-600">Impact des dons</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Légal & Support</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-blue-600">Contactez-nous</a></li>
                                <li><a href="#" className="hover:text-blue-600">Confidentialité</a></li>
                                <li><a href="#" className="hover:text-blue-600">CGU</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-500">
                            © 2024 BourseConnect. Tous droits réservés.
                        </p>
                        <div className="flex gap-4">
                            {/* Social Placeholders */}
                            <div className="w-8 h-8 rounded-full bg-gray-200 hover:bg-blue-100 flex items-center justify-center text-gray-500 hover:text-blue-600 cursor-pointer transition-colors">in</div>
                            <div className="w-8 h-8 rounded-full bg-gray-200 hover:bg-blue-100 flex items-center justify-center text-gray-500 hover:text-blue-600 cursor-pointer transition-colors">fb</div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
