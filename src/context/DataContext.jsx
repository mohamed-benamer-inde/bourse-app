import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch requests when user is logged in
    const refreshRequests = async () => {
        if (user) {
            setLoading(true);
            try {
                const res = await api.get('/requests');
                const requestsData = res.data || [];
                const enrichedRequests = requestsData.map(req => {
                    if (!req.student) req.student = {};
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

    useEffect(() => {
        refreshRequests();
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


                    return updatedReq;
                }
                return req;
            }));
            return { success: true };
        } catch (err) {
            console.error("Error updating status", err);
            return { success: false, message: err.response?.data?.message || "Une erreur inattendue est survenue." };
        }
    };

    const createRequest = async (amountNeeded, status = 'SUBMITTED', needs = []) => {
        try {
            const res = await api.post('/requests', { amountNeeded, status, needs });
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

    const submitAIFeedback = async (originalText, aiReason, context = 'général') => {
        try {
            await api.post('/feedback/ai', { originalText, aiReason, context });
            return true;
        } catch (err) {
            console.error("Error submitting AI feedback", err);
            return false;
        }
    };

    return (
        <DataContext.Provider value={{ requests, updateRequestStatus, createRequest, getStudentRequest, getDonorRequests, submitAIFeedback, refreshRequests, loading }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
