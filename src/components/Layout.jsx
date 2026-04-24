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
            <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2">
                        <GraduationCap className="h-8 w-8 text-blue-600" />
                        <span className="font-bold text-xl hidden sm:inline-block">BourseConnect</span>
                    </Link>

                    <nav className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-medium hover:underline underline-offset-4">
                            Connexion
                        </Link>
                        <Link to="/register">
                            <Button size="sm">Inscription</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="border-t py-6 md:py-0">
                <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 md:h-24">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        © 2024 BourseConnect. Tous droits réservés.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
