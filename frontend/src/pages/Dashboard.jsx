import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  Target,
  Clock,
  MapPin,
  CheckCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchStats, fetchJobs } from '../services/api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button
} from '../components/ui.jsx';

const getStatusBadge = (status) => {
  const statusConfig = {
    waiting: { variant: 'default', label: 'Waiting' },
    'agent_on_way': { variant: 'info', label: 'Agent on Way' },
    inspecting: { variant: 'warning', label: 'Inspecting' },
    completed: { variant: 'success', label: 'Completed' },
  };

  const config = statusConfig[status] || statusConfig.waiting;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    active_pickups: 0,
    total_devices: 0,
    total_payouts: 0,
    ai_accuracy: 0,
  });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, jobsRes] = await Promise.all([
          fetchStats(),
          fetchJobs()
        ]);
        
        setStats(statsRes.data);
        setJobs(jobsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const statsConfig = [
    {
      title: 'Active Pickups',
      value: stats.active_pickups,
      icon: Clock,
      trend: '+3 from yesterday',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Devices Collected',
      value: stats.total_devices,
      icon: Package,
      trend: '+23 today',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Payouts',
      value: `₹${(stats.total_payouts / 100000).toFixed(1)}L`,
      icon: DollarSign,
      trend: '+₹45k today',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'AI Accuracy',
      value: `${stats.ai_accuracy}%`,
      icon: Target,
      trend: '+2.1% this week',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Job Management Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Jobs</CardTitle>
          <Button size="sm">View All</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Device Model</TableHead>
                <TableHead>Assigned Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Final Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.id}</TableCell>
                  <TableCell>{job.customer_name}</TableCell>
                  <TableCell>{job.device_model}</TableCell>
                  <TableCell>{job.agent_name}</TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell className="font-semibold">
                    {job.final_price ? `₹${job.final_price.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
