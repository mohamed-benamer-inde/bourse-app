import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch requests when user is logged in
    useEffect(() => {
        const fetchRequests = async () => {
            if (user) {
                setLoading(true);
                try {
                    const res = await api.get('/requests');
                    const requestsData = res.data || [];
                    // Mock/Enrich data for demo purposes if fields are missing
                    const enrichedRequests = requestsData.map(req => {
                        if (!req.student) req.student = {};
                        // Ensure student object has necessary fields for demo
                        if (!req.student.name) req.student.name = "Amine El Amrani";
                        if (!req.student.email) req.student.email = "amine@example.com";
                        if (!req.student.phone) req.student.phone = "06 12 34 56 78";
                        if (!req.student.educationLevel) req.student.educationLevel = "Master 1";
                        if (!req.student.studyField) req.student.studyField = "Informatique";
                        if (!req.student.rsuScore) req.student.rsuScore = "9.45";
                        if (!req.student.resources) req.student.resources = 1200;
                        if (!req.student.description) req.student.description = "Étudiant motivé cherchant un soutien pour financer son projet de fin d'études en IA.";
                        if (!req.student.gradeCurrent) req.student.gradeCurrent = 16.5;
                        if (!req.student.gradeN1) req.student.gradeN1 = 15.8;
                        if (!req.student.gradeN2) req.student.gradeN2 = 14.5;
                        if (!req.student.gradeN3) req.student.gradeN3 = 16.0;
                        if (!req.student.transcriptStatus) req.student.transcriptStatus = 'valid';

                        // Initialize exchanges if not present
                        if (!req.exchanges) req.exchanges = [];

                        return req;
                    });
                    setRequests(enrichedRequests);
                } catch (err) {
                    console.error("Error fetching requests", err);
                } finally {
                    setLoading(false);
                }
            } else {
                setRequests([]);
            }
        };
        fetchRequests();
    }, [user]);

    const updateRequestStatus = async (requestId, newStatus, userId, userName, data = null) => {
        try {
            const payload = { status: newStatus };
            if (data) payload.data = data; // Send extra data if exists

            const res = await api.put(`/requests/${requestId}/status`, payload);

            // Update local state
            setRequests(prev => prev.map(req => {
                if (req._id === requestId || req.id === requestId) {
                    // Merge server response with local mock data preservation if needed
                    // For demo: if status is REQUEST_INFO, append message to exchanges
                    const updatedReq = { ...req, ...res.data, status: newStatus };

                    if (data && newStatus === 'REQUEST_INFO') {
                        if (!updatedReq.exchanges) updatedReq.exchanges = [];
                        updatedReq.exchanges.push({
                            date: new Date().toISOString(),
                            type: 'REQUEST',
                            message: data.message,
                            from: userName
                        });
                    }
                    if (data && newStatus === 'ANALYZING' && data.response) { // Student responding
                        if (!updatedReq.exchanges) updatedReq.exchanges = [];
                        updatedReq.exchanges.push({
                            date: new Date().toISOString(),
                            type: 'RESPONSE',
                            message: data.response,
                            attachments: data.attachments || [],
                            from: userName
                        });
                    }

                    return updatedReq;
                }
                return req;
            }));
            return true;
        } catch (err) {
            console.error("Error updating status", err);
            return false;
        }
    };

    const createRequest = async (amountNeeded) => {
        try {
            const res = await api.post('/requests', { amountNeeded });
            setRequests(prev => [...prev, res.data]);
            return true;
        } catch (err) {
            console.error("Error creating request", err);
            return false;
        }
    };

    const getStudentRequest = (studentId) => {
        // In the new API, we fetch requests relevant to the user.
        // If student, requests array contains their request.
        return requests.find(r => r.student._id === studentId || r.student === studentId);
    };

    const getDonorRequests = () => {
        // If donor, requests array contains all available/assigned requests
        return requests;
    };

    return (
        <DataContext.Provider value={{ requests, updateRequestStatus, createRequest, getStudentRequest, getDonorRequests, loading }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
