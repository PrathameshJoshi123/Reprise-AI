// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout.jsx';
import Dashboard from './pages/Dashboard';
import LiveOps from './pages/LiveOps';
import AIControl from './pages/AIControl';
import Inventory from './pages/Inventory';
import Agents from './pages/Agents';
import Dealers from './pages/Dealers';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live-ops" element={<LiveOps />} />
          <Route path="/ai-control" element={<AIControl />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/dealers" element={<Dealers />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;