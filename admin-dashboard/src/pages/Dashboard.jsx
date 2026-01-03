// src/pages/Dashboard.jsx
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  Target,
  Clock,
  MapPin,
  CheckCircle
} from 'lucide-react';
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

// Mock data - replace with API calls later
const stats = [
  {
    title: 'Active Pickups',
    value: '12',
    icon: Clock,
    trend: '+3 from yesterday',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Total Devices Collected',
    value: '847',
    icon: Package,
    trend: '+23 today',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Total Payouts',
    value: '₹3.2L',
    icon: DollarSign,
    trend: '+₹45k today',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'AI Accuracy',
    value: '94.2%',
    icon: Target,
    trend: '+2.1% this week',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
];

const recentJobs = [
  {
    id: 'PK-001',
    customerName: 'Rahul Sharma',
    deviceModel: 'iPhone 13 Pro',
    agent: 'Agent A',
    status: 'inspecting',
    finalPrice: '₹42,000',
  },
  {
    id: 'PK-002',
    customerName: 'Priya Patel',
    deviceModel: 'MacBook Air M1',
    agent: 'Agent B',
    status: 'completed',
    finalPrice: '₹55,000',
  },
  {
    id: 'PK-003',
    customerName: 'Amit Kumar',
    deviceModel: 'Samsung S23',
    agent: 'Agent C',
    status: 'on-way',
    finalPrice: '₹32,000',
  },
  {
    id: 'PK-004',
    customerName: 'Sneha Reddy',
    deviceModel: 'Dell XPS 15',
    agent: 'Agent A',
    status: 'waiting',
    finalPrice: '-',
  },
  {
    id: 'PK-005',
    customerName: 'Vikram Singh',
    deviceModel: 'iPhone 12',
    agent: 'Agent D',
    status: 'completed',
    finalPrice: '₹28,500',
  },
];

const getStatusBadge = (status) => {
  const statusConfig = {
    waiting: { variant: 'default', label: 'Waiting' },
    'on-way': { variant: 'info', label: 'Agent on Way' },
    inspecting: { variant: 'warning', label: 'Inspecting' },
    completed: { variant: 'success', label: 'Completed' },
  };

  const config = statusConfig[status] || statusConfig.waiting;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
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
              {recentJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.id}</TableCell>
                  <TableCell>{job.customerName}</TableCell>
                  <TableCell>{job.deviceModel}</TableCell>
                  <TableCell>{job.agent}</TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell className="font-semibold">{job.finalPrice}</TableCell>
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