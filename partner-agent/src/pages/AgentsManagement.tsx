import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

interface Agent {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  employee_id?: string;
  is_active: boolean;
  created_at: string;
}

export default function AgentsManagement() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    employee_id: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await api.get("/partner/agents");
      setAgents(response.data);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      await api.post("/partner/agents", formData);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        employee_id: "",
      });
      setShowAddForm(false);
      await fetchAgents();
      alert("Agent added successfully!");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to add agent");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (
    agentId: number,
    currentStatus: boolean,
  ) => {
    const newStatus = !currentStatus;

    try {
      await api.patch(`/partner/agents/${agentId}`, { is_active: newStatus });
      await fetchAgents();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to update agent status");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header
        pageTitle="Agents Management"
        showLogout={true}
        onLogout={handleLogout}
        additionalContent={
          <Button
            variant="outline"
            onClick={() => navigate("/partner/dashboard")}
          >
            ← Back to Dashboard
          </Button>
        }
      />
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-gray-500">Manage your delivery agents</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Add Agent Button */}
        <div className="mb-6">
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : "+ Add New Agent"}
          </Button>
        </div>

        {/* Add Agent Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Agent</CardTitle>
              <CardDescription>Create a new agent account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAgent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      required
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Employee ID (Optional)</Label>
                    <Input
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employee_id: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Adding..." : "Add Agent"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Agents List */}
        {loading ? (
          <div className="text-center py-12">Loading agents...</div>
        ) : agents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No agents added yet</p>
              <Button onClick={() => setShowAddForm(true)}>
                Add Your First Agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{agent.full_name}</CardTitle>
                    <Badge variant={agent.is_active ? "default" : "secondary"}>
                      {agent.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium">{agent.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <div className="font-medium">{agent.phone}</div>
                  </div>
                  {agent.employee_id && (
                    <div>
                      <div className="text-sm text-gray-500">Employee ID</div>
                      <div className="font-medium">{agent.employee_id}</div>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      handleToggleStatus(agent.id, agent.is_active)
                    }
                  >
                    {agent.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
