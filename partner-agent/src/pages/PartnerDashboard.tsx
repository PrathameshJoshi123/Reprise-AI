import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import Header from "../components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { formatPrice } from "../lib/utils";

interface Lead {
  id: number;
  customer_id: number;
  customer_name: string;
  brand: string;
  model: string;
  ram_gb: number;
  storage_gb: number;
  ai_estimated_price: number;
  final_quoted_price: number;
  ai_reasoning: string;
  status: string;
  created_at: string;
  lead_locked_at?: string;
  lead_lock_expires_at?: string;
  purchased_at?: string;
  assigned_at?: string;
  accepted_at?: string;
  completed_at?: string;
  agent_id?: number;
  agent_name?: string;
  agent_phone?: string;
  pickup_pincode?: string;
  pickup_city?: string;
  pickup_state?: string;
  lead_cost?: number;
  time_remaining?: number;
}

interface Agent {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  is_active: boolean;
}

export default function PartnerDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [lockedDeals, setLockedDeals] = useState<Lead[]>([]);
  const [purchasedOrders, setPurchasedOrders] = useState<Lead[]>([]);
  const [acceptedLeads, setAcceptedLeads] = useState<Lead[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [assigningOrder, setAssigningOrder] = useState<number | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);

  useEffect(() => {
    fetchAllData();
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await api.get("/partner/agents");
      setAgents(response.data || []);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const lockedResponse = await api.get("/partner/locked-deals");
      setLockedDeals(lockedResponse.data || []);

      // Fetch
      // Fetch all orders for the partner
      const response = await api.get("/partner/orders");
      const orders: Lead[] = response.data;

      // Filter orders by status
      // Purchased but not yet assigned
      setPurchasedOrders(
        orders.filter((order) => order.status === "lead_purchased"),
      );

      // Assigned and in progress
      setAcceptedLeads(
        orders.filter(
          (order) =>
            order.status === "assigned_to_agent" ||
            order.status === "accepted_by_agent" ||
            order.status === "pickup_scheduled",
        ),
      );

      setCompletedOrders(
        orders.filter(
          (order) =>
            order.status === "pickup_completed" ||
            order.status === "payment_processed" ||
            order.status === "completed",
        ),
      );
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Credit plans and purchase flow
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const openBuyModal = async () => {
    try {
      const resp = await api.get("/partner/credit-plans");
      setPlans(resp.data || []);
      setShowBuyModal(true);
    } catch (err) {
      console.error("Failed to load credit plans:", err);
      alert("Unable to load credit plans");
    }
  };

  const handleBuyPlan = async (planId: number) => {
    if (!confirm("Proceed to buy this credit plan?")) return;
    setPurchaseLoading(true);
    try {
      const resp = await api.post("/partner/purchase-credits", {
        plan_id: planId,
        payment_method: "manual",
      });
      alert(resp.data?.message || "Purchase successful");
      setShowBuyModal(false);
      // refresh user balance and reload orders
      await refreshUser();
      await fetchAllData();
    } catch (err: any) {
      console.error("Purchase failed:", err);
      alert(err.response?.data?.detail || "Failed to purchase credits");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleAssignAgent = async (orderId: number, agentId: number) => {
    if (!confirm("Assign this order to the selected agent?")) return;
    try {
      await api.post(`/partner/orders/${orderId}/assign?agent_id=${agentId}`);
      alert("Order assigned successfully");
      setAssigningOrder(null);
      setSelectedAgent(null);
      await fetchAllData();
    } catch (err: any) {
      console.error("Assignment failed:", err);
      alert(err.response?.data?.detail || "Failed to assign agent");
    }
  };

  const handlePurchaseLockedDeal = async (orderId: number) => {
    try {
      // First get purchase info to show confirmation
      const infoResponse = await api.get(
        `/partner/lead-purchase-info/${orderId}`,
      );
      const info = infoResponse.data;

      if (!info.has_sufficient_credits) {
        alert(
          `Insufficient credits! You need ₹${info.shortage_amount} more credits. Current balance: ₹${info.current_balance}`,
        );
        return;
      }

      const confirmMsg = `Purchase this lead for ₹${info.lead_cost} credits?\n\nPhone: ${info.brand} ${info.model}\nPrice: ₹${info.final_quoted_price}\n\nYour balance will be: ₹${info.balance_after}`;

      if (!confirm(confirmMsg)) return;

      await api.post(`/sell-phone/partner/leads/${orderId}/purchase`);
      alert("Lead purchased successfully!");
      await refreshUser();
      await fetchAllData();
    } catch (err: any) {
      console.error("Purchase failed:", err);
      alert(err.response?.data?.detail || "Failed to purchase lead");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      lead_created: "bg-blue-500",
      partner_locked: "bg-purple-500",
      agent_assigned: "bg-yellow-500",
      agent_accepted: "bg-green-500",
      pickup_scheduled: "bg-teal-500",
      pickup_completed: "bg-indigo-500",
      payment_processed: "bg-emerald-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const LeadCard = ({
    lead,
    showLockButton,
  }: {
    lead: Lead;
    showLockButton?: boolean;
  }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {lead.brand} {lead.model}
            </CardTitle>
            <CardDescription>
              {lead.ram_gb}GB RAM • {lead.storage_gb}GB Storage
            </CardDescription>
          </div>
          <Badge className={getStatusColor(lead.status)}>
            {lead.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-500">AI Estimated Price</div>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(lead.ai_estimated_price || lead.final_quoted_price)}
            </div>
            <div className="mt-2">
              <Button size="sm" onClick={openBuyModal}>
                Buy Credits
              </Button>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">Customer</div>
            <div className="font-medium">{lead.customer_name}</div>
          </div>

          {lead.agent_name && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Assigned Agent</div>
              <div className="font-medium">{lead.agent_name}</div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/partner/lead/${lead.id}`)}
            >
              View Details
            </Button>
            {showLockButton && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => navigate(`/partner/lead/${lead.id}`)}
              >
                Lock Lead
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Header
        pageTitle="Partner Dashboard"
        userName={user?.name}
        showLogout={true}
        onLogout={handleLogout}
        additionalContent={
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Credit Balance</div>
              <div className="text-xl font-bold text-green-600">
                ₹{user?.credit_balance || 0}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={openBuyModal}>
                Buy Credits
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/partner/marketplace")}
              >
                Marketplace
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/partner/agents")}
              >
                Manage Agents
              </Button>
            </div>
          </div>
        }
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="locked" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="locked">
                Locked Deals ({lockedDeals.length})
              </TabsTrigger>
              <TabsTrigger value="purchased">
                Purchased ({purchasedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="accepted">
                In Progress ({acceptedLeads.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="locked">
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : lockedDeals.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500 mb-4">
                      No locked deals at the moment
                    </p>
                    <Button onClick={() => navigate("/partner/marketplace")}>
                      Go to Marketplace
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lockedDeals.map((lead) => (
                    <Card
                      key={lead.id}
                      className="hover:shadow-lg transition-shadow border-2 border-purple-200"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {lead.brand} {lead.model}
                            </CardTitle>
                            <CardDescription>
                              {lead.ram_gb}GB RAM • {lead.storage_gb}GB Storage
                            </CardDescription>
                          </div>
                          <Badge className="bg-purple-500">Locked</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm text-gray-500">Price</div>
                            <div className="text-2xl font-bold text-green-600">
                              {formatPrice(
                                lead.ai_estimated_price ||
                                  lead.final_quoted_price,
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-gray-500">
                              Lead Cost
                            </div>
                            <div className="text-lg font-semibold text-orange-600">
                              {formatPrice(lead.lead_cost || 0)}
                            </div>
                          </div>

                          {lead.time_remaining && lead.time_remaining > 0 && (
                            <div>
                              <div className="text-sm text-gray-500">
                                Time Remaining
                              </div>
                              <div className="text-sm font-medium text-red-600">
                                {Math.floor(lead.time_remaining / 60)} min{" "}
                                {Math.floor(lead.time_remaining % 60)} sec
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="text-sm text-gray-500 mb-1">
                              Customer
                            </div>
                            <div className="font-medium">
                              {lead.customer_name}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-gray-500 mb-1">
                              Location
                            </div>
                            <div className="text-sm">
                              {lead.pickup_city}, {lead.pickup_state} -{" "}
                              {lead.pickup_pincode}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() =>
                                navigate(`/partner/lead/${lead.id}`)
                              }
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handlePurchaseLockedDeal(lead.id)}
                            >
                              Purchase
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="purchased">
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : purchasedOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500 mb-4">
                      No purchased orders yet
                    </p>
                    <Button onClick={() => navigate("/partner/marketplace")}>
                      Go to Marketplace
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {purchasedOrders.map((lead) => (
                    <Card
                      key={lead.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {lead.brand} {lead.model}
                            </CardTitle>
                            <CardDescription>
                              {lead.ram_gb}GB RAM • {lead.storage_gb}GB Storage
                            </CardDescription>
                          </div>
                          <Badge className="bg-green-500">Purchased</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm text-gray-500">Price</div>
                            <div className="text-2xl font-bold text-green-600">
                              {formatPrice(
                                lead.ai_estimated_price ||
                                  lead.final_quoted_price,
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-gray-500 mb-1">
                              Customer
                            </div>
                            <div className="font-medium">
                              {lead.customer_name}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-gray-500 mb-1">
                              Location
                            </div>
                            <div className="text-sm">
                              {lead.pickup_city}, {lead.pickup_state} -{" "}
                              {lead.pickup_pincode}
                            </div>
                          </div>

                          {assigningOrder === lead.id ? (
                            <div className="space-y-2">
                              <select
                                className="w-full border rounded px-3 py-2"
                                value={selectedAgent || ""}
                                onChange={(e) =>
                                  setSelectedAgent(Number(e.target.value))
                                }
                              >
                                <option value="">Select an agent</option>
                                {agents
                                  .filter((a) => a.is_active)
                                  .map((agent) => (
                                    <option key={agent.id} value={agent.id}>
                                      {agent.full_name}
                                    </option>
                                  ))}
                              </select>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() =>
                                    selectedAgent &&
                                    handleAssignAgent(lead.id, selectedAgent)
                                  }
                                  disabled={!selectedAgent}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    setAssigningOrder(null);
                                    setSelectedAgent(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() =>
                                  navigate(`/partner/lead/${lead.id}`)
                                }
                              >
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={() => setAssigningOrder(lead.id)}
                              >
                                Assign Agent
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="accepted">
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : acceptedLeads.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">No orders in progress</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {acceptedLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : completedOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">No completed orders</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedOrders.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Buy Credits Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowBuyModal(false)}
          ></div>

          <div className="relative w-full max-w-2xl bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-2">Buy Credits</h2>
            <p className="text-sm text-gray-500 mb-4">
              Choose a credit plan to purchase
            </p>

            <div className="space-y-4">
              {plans.map((p) => (
                <Card key={p.id}>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{p.plan_name}</div>
                        <div className="text-sm text-gray-500">
                          {p.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {p.credit_amount} credits
                        </div>
                        <div className="text-sm text-gray-500">₹{p.price}</div>
                        <div className="mt-2">
                          <Button
                            size="sm"
                            onClick={() => handleBuyPlan(p.id)}
                            disabled={purchaseLoading}
                          >
                            {purchaseLoading ? "Processing..." : "Buy"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-4 text-right">
              <Button variant="outline" onClick={() => setShowBuyModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
