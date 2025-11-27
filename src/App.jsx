import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/student/Dashboard';
import DonorDashboard from './pages/donor/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

function App() {
    return (
        <AuthProvider>
            <DataProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Layout><Landing /></Layout>} />
                        <Route path="/login" element={<Layout><Login /></Layout>} />
                        <Route path="/register" element={<Layout><Register /></Layout>} />

                        {/* Protected Routes (Mock) */}
                        <Route path="/student" element={<Layout><StudentDashboard /></Layout>} />
                        <Route path="/donor" element={<Layout><DonorDashboard /></Layout>} />
                        <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
                    </Routes>
                </Router>
            </DataProvider>
        </AuthProvider>
    );
}

export default App;
