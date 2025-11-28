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

    const createRequest = async (amountNeeded, status = 'SUBMITTED') => {
        try {
            const res = await api.post('/requests', { amountNeeded, status });
            setRequests(prev => [...prev, res.data]);
            return res.data;
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
