import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, CheckCircle, AlertCircle, Heart } from 'lucide-react';

const AdminDashboard = () => {
    // Mock data
    const stats = [
        { label: 'Total Étudiants', value: '124', icon: Users, color: 'text-blue-600' },
        { label: 'Total Donateurs', value: '45', icon: Heart, color: 'text-red-600' },
        { label: 'Dossiers Validés', value: '89', icon: CheckCircle, color: 'text-green-600' },
        { label: 'En Attente', value: '35', icon: AlertCircle, color: 'text-yellow-600' },
    ];

    const recentRequests = [
        { id: 1, student: 'Sarah Martin', status: 'En attente', date: '24/11/2024' },
        { id: 2, student: 'Thomas Dubois', status: 'Promesse', date: '23/11/2024' },
        { id: 3, student: 'Léa Bernard', status: 'Payé', date: '22/11/2024' },
        { id: 4, student: 'Karim Benali', status: 'Validé', date: '21/11/2024' },
    ];

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Administration</h1>
                <p className="text-muted-foreground">Vue d'ensemble de la plateforme.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index}>
                        <CardContent className="flex items-center p-6">
                            <div className={`p-3 rounded-full bg-gray-100 mr-4 ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                <h3 className="text-2xl font-bold">{stat.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Dernières Activités</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Étudiant</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Statut</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {recentRequests.map((request) => (
                                    <tr key={request.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{request.student}</td>
                                        <td className="p-4 align-middle">{request.date}</td>
                                        <td className="p-4 align-middle">
                                            <Badge variant="outline">{request.status}</Badge>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <Button variant="ghost" size="sm">Voir</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDashboard;
