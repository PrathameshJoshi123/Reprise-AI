import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin, User, Clock, CheckCircle } from 'lucide-react';
import { fetchAgentLocations, fetchKanbanJobs } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../components/ui.jsx';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const statusColors = {
  waiting: 'bg-gray-100 border-gray-300',
  agent_on_way: 'bg-blue-100 border-blue-300',
  inspecting: 'bg-yellow-100 border-yellow-300',
  completed: 'bg-green-100 border-green-300',
};

const statusIcons = {
  waiting: Clock,
  agent_on_way: MapPin,
  inspecting: User,
  completed: CheckCircle,
};

export default function LiveOps() {
  const [agentLocations, setAgentLocations] = useState([]);
  const [kanbanData, setKanbanData] = useState({
    waiting: [],
    agent_on_way: [],
    inspecting: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [locationsRes, kanbanRes] = await Promise.all([
          fetchAgentLocations(),
          fetchKanbanJobs()
        ]);
        
        setAgentLocations(locationsRes.data);
        setKanbanData(kanbanRes.data);
      } catch (error) {
        console.error('Error fetching live ops data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading Live Ops...</div>
      </div>
    );
  }

  const getAgentStatusColor = (status) => {
    const colors = {
      idle: 'bg-gray-500',
      on_site: 'bg-yellow-500',
      in_transit: 'bg-blue-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Live Operations</h1>
        <p className="text-gray-500 mt-1">Real-time agent tracking and job pipeline</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Location Map */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Agent Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 rounded-lg overflow-hidden">
              <MapContainer 
                center={[28.6139, 77.2090]} 
                zoom={11} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {agentLocations.map((agent) => (
                  <Marker 
                    key={agent.id} 
                    position={[agent.latitude, agent.longitude]}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold">{agent.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`h-2 w-2 rounded-full ${getAgentStatusColor(agent.status)}`} />
                          <span className="text-sm capitalize">{agent.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            
            {/* Agent Legend */}
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-500" />
                <span className="text-sm">Idle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm">In Transit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm">On Site</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Job Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 h-96 overflow-y-auto">
              {/* Waiting Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <h3 className="font-semibold">Waiting</h3>
                  <Badge variant="default">{kanbanData.waiting.length}</Badge>
                </div>
                <div className="space-y-2">
                  {kanbanData.waiting.map((job) => (
                    <div
                      key={job.id}
                      className={`p-3 rounded-lg border ${statusColors.waiting}`}
                    >
                      <p className="font-medium text-sm">{job.customer}</p>
                      <p className="text-xs text-gray-600">{job.device}</p>
                      <p className="text-xs text-gray-500 mt-1">{job.agent}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent on Way Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <h3 className="font-semibold">On Way</h3>
                  <Badge variant="info">{kanbanData.agent_on_way.length}</Badge>
                </div>
                <div className="space-y-2">
                  {kanbanData.agent_on_way.map((job) => (
                    <div
                      key={job.id}
                      className={`p-3 rounded-lg border ${statusColors.agent_on_way}`}
                    >
                      <p className="font-medium text-sm">{job.customer}</p>
                      <p className="text-xs text-gray-600">{job.device}</p>
                      <p className="text-xs text-gray-500 mt-1">{job.agent}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inspecting Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-yellow-500" />
                  <h3 className="font-semibold">Inspecting</h3>
                  <Badge variant="warning">{kanbanData.inspecting.length}</Badge>
                </div>
                <div className="space-y-2">
                  {kanbanData.inspecting.map((job) => (
                    <div
                      key={job.id}
                      className={`p-3 rounded-lg border ${statusColors.inspecting}`}
                    >
                      <p className="font-medium text-sm">{job.customer}</p>
                      <p className="text-xs text-gray-600">{job.device}</p>
                      <p className="text-xs text-gray-500 mt-1">{job.agent}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completed Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <h3 className="font-semibold">Completed</h3>
                  <Badge variant="success">{kanbanData.completed.length}</Badge>
                </div>
                <div className="space-y-2">
                  {kanbanData.completed.map((job) => (
                    <div
                      key={job.id}
                      className={`p-3 rounded-lg border ${statusColors.completed}`}
                    >
                      <p className="font-medium text-sm">{job.customer}</p>
                      <p className="text-xs text-gray-600">{job.device}</p>
                      <p className="text-xs text-gray-500 mt-1">{job.agent}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

