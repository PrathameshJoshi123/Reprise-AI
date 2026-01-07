import { useEffect, useState } from 'react';
import { Trophy, Star, Clock, CheckCircle, Phone, Mail, User } from 'lucide-react';
import { fetchAgentLeaderboard } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui.jsx';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const response = await fetchAgentLeaderboard();
        setAgents(response.data);
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading agents...</div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? <Badge variant="success">Active</Badge>
      : <Badge variant="default">Idle</Badge>;
  };

  const getRankBadge = (index) => {
    const colors = ['bg-yellow-100 text-yellow-800', 'bg-gray-100 text-gray-800', 'bg-orange-100 text-orange-800'];
    if (index < 3) {
      return (
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${colors[index]}`}>
          <Trophy className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold">
        {index + 1}
      </div>
    );
  };

  // Calculate summary stats
  const totalJobs = agents.reduce((sum, agent) => sum + agent.completed_jobs, 0);
  const avgRating = (agents.reduce((sum, agent) => sum + agent.rating, 0) / agents.length).toFixed(1);
  const activeAgents = agents.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agent Management</h1>
        <p className="text-gray-500 mt-1">Monitor agent performance and track metrics</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-3xl font-bold mt-2">{agents.length}</p>
                <p className="text-xs text-gray-500 mt-1">{activeAgents} active now</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs Completed</p>
                <p className="text-3xl font-bold mt-2">{totalJobs}</p>
                <p className="text-xs text-gray-500 mt-1">Across all agents</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-3xl font-bold mt-2">{avgRating}</p>
                <p className="text-xs text-gray-500 mt-1">Out of 5.0</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Agent Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Jobs Completed</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Avg Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent, index) => (
                <TableRow key={agent.id}>
                  <TableCell>{getRankBadge(index)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{agent.name}</p>
                      <p className="text-xs text-gray-500">ID: {agent.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Mail className="h-3 w-3" />
                        {agent.email}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Phone className="h-3 w-3" />
                        {agent.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{agent.completed_jobs}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{agent.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {agent.avg_inspection_time} min
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(agent.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {agent.current_job || 'No active job'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.slice(0, 3).map((agent, index) => (
          <Card key={agent.id} className={index === 0 ? 'border-2 border-yellow-400' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getRankBadge(index)}
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                </div>
                {index === 0 && <Trophy className="h-6 w-6 text-yellow-500" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Jobs Completed</span>
                  <span className="text-lg font-bold">{agent.completed_jobs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-bold">{agent.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Time</span>
                  <span className="text-lg font-bold">{agent.avg_inspection_time} min</span>
                </div>
                <div className="pt-2 border-t">
                  {getStatusBadge(agent.status)}
                  {agent.current_job && (
                    <p className="text-xs text-gray-500 mt-2">{agent.current_job}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

