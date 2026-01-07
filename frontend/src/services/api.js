import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const fetchStats = () => api.get('/admin/stats');
export const fetchJobs = () => api.get('/jobs/');
export const fetchAgentLocations = () => api.get('/agents/locations');
export const fetchKanbanJobs = () => api.get('/jobs/kanban');
export const fetchAgentLeaderboard = () => api.get('/agents/leaderboard');

// AI Monitoring endpoints
export const fetchAnomalies = () => api.get('/ai-monitoring/anomalies');
export const fetchMarketTrends = () => api.get('/ai-monitoring/market-trends');
export const fetchPhotos = (transactionId) => api.get(`/ai-monitoring/photos/${transactionId}`);

// Inventory endpoints
export const fetchInventory = () => api.get('/inventory/devices');
export const updateDevicePrice = (deviceId, price, reason) => 
  api.patch(`/inventory/devices/${deviceId}/price`, null, { params: { price, reason } });

// Dealers endpoints
export const fetchDealers = () => api.get('/dealers/');

// Reports endpoints
export const fetchReports = () => api.get('/reports/analytics');

export default api;