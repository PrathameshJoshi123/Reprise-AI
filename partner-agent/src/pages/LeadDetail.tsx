import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import Header from "../components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";

interface Lead {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  pickup_address_line: string;
  pickup_city: string;
  pickup_state: string;
  pickup_pincode: string;
  brand: string;
  model: string;
  ram_gb: number;
  storage_gb: number;
  ai_estimated_price: number;
  final_quoted_price: number;
  ai_reasoning: string;
  customer_condition_answers: {
    screen_condition: string;
    device_turns_on: boolean;
    has_original_box: boolean;
    has_original_bill: boolean;
  };
  status: string;
  created_at: string;
  lead_locked_at?: string;
  purchased_at?: string;
  assigned_at?: string;
  agent_id?: number;
  agent_name?: string;
}

interface Agent {
  id: number;
  full_name: string;
  phone: string;
  is_active: boolean;
}

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [ordersRes, agentsRes] = await Promise.all([
        api.get("/partner/orders"),
        api.get("/partner/agents"),
      ]);
      // Find the specific order by ID
      const order = ordersRes.data.find((o: Lead) => o.id === parseInt(id!));
      setLead(order || null);
      setAgents(agentsRes.data.filter((a: Agent) => a.is_active));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedAgentId) {
      alert("Please select an agent");
      return;
    }

    setActionLoading(true);
    try {
      await api.post(
        `/partner/orders/${id}/assign?agent_id=${selectedAgentId}`,
      );
      await fetchData();
      alert("Agent assigned successfully!");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to assign agent");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">Lead not found</p>
            <Button
              className="mt-4 w-full"
              onClick={() => navigate("/partner/dashboard")}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPurchased =
    lead.status === "lead_purchased" ||
    lead.status === "assigned_to_agent" ||
    lead.status === "accepted_by_agent";
  const canAssignAgent = lead.status === "lead_purchased" && !lead.agent_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header
        pageTitle="Lead Details"
        showLogout={true}
        onLogout={handleLogout}
        additionalContent={
          <Badge className="text-base px-4 py-1">
            {lead.status.replace(/_/g, " ")}
          </Badge>
        }
      />
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="outline"
            onClick={() => navigate("/partner/dashboard")}
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Phone Details */}
          <Card>
            <CardHeader>
              <CardTitle>Phone Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Brand & Model</Label>
                  <div className="text-lg font-semibold">
                    {lead.brand} {lead.model}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Configuration</Label>
                  <div className="text-lg font-semibold">
                    {lead.ram_gb}GB RAM • {lead.storage_gb}GB Storage
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Prediction */}
          <Card>
            <CardHeader>
              <CardTitle>AI Price Prediction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-500">AI Estimated Price</Label>
                <div className="text-3xl font-bold text-green-600">
                  {formatPrice(
                    lead.ai_estimated_price || lead.final_quoted_price,
                  )}
                </div>
              </div>
              <div>
                <Label className="text-gray-500">AI Reasoning</Label>
                <div className="text-sm bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                  {lead.ai_reasoning}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phone Condition */}
          <Card>
            <CardHeader>
              <CardTitle>Phone Condition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Screen Condition</Label>
                  <div className="font-semibold capitalize">
                    {lead.customer_condition_answers.screen_condition}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Device Status</Label>
                  <div className="font-semibold">
                    {lead.customer_condition_answers.device_turns_on
                      ? "Turns On"
                      : "Does Not Turn On"}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Original Box</Label>
                  <div className="font-semibold">
                    {lead.customer_condition_answers.has_original_box
                      ? "Yes"
                      : "No"}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Original Bill</Label>
                  <div className="font-semibold">
                    {lead.customer_condition_answers.has_original_bill
                      ? "Yes"
                      : "No"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Details */}
          {isPurchased && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-gray-500">Name</Label>
                  <div className="font-semibold">{lead.customer_name}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Phone</Label>
                  <div className="font-semibold">{lead.customer_phone}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Address</Label>
                  <div className="font-semibold">
                    {lead.pickup_address_line}, {lead.pickup_city},{" "}
                    {lead.pickup_state} - {lead.pickup_pincode}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assign Agent */}
          {canAssignAgent && (
            <Card>
              <CardHeader>
                <CardTitle>Assign Agent</CardTitle>
                <CardDescription>
                  Select an agent to handle this pickup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {agents.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No active agents available. Add agents first.
                    </p>
                  ) : (
                    agents.map((agent) => (
                      <div
                        key={agent.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAgentId === agent.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedAgentId(agent.id)}
                      >
                        <div className="font-semibold">{agent.full_name}</div>
                        <div className="text-sm text-gray-500">
                          {agent.phone}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {agents.length > 0 && (
                  <Button
                    onClick={handleAssignAgent}
                    disabled={actionLoading || !selectedAgentId}
                    className="w-full"
                  >
                    {actionLoading ? "Assigning..." : "Assign Selected Agent"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate("/partner/agents")}
                  className="w-full"
                >
                  Manage Agents
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Agent Info */}
          {lead.agent_name && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-semibold text-lg">{lead.agent_name}</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
