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
import { Badge } from "../components/ui/badge";
import { formatPrice } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  const [activeTab, setActiveTab] = useState<
    "lead_locked" | "lead_purchased" | "accepted_by_agent" | "pickup_completed"
  >("lead_locked");
  const [leadLockedDeals, setLeadLockedDeals] = useState<Lead[]>([]);
  const [leadPurchasedOrders, setLeadPurchasedOrders] = useState<Lead[]>([]);
  const [acceptedByAgentLeads, setAcceptedByAgentLeads] = useState<Lead[]>([]);
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
      setLeadLockedDeals(lockedResponse.data || []);

      const response = await api.get("/partner/orders");
      const orders: Lead[] = response.data;

      setLeadPurchasedOrders(
        orders.filter((order) => order.status === "lead_purchased"),
      );

      setAcceptedByAgentLeads(
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                {lead.brand} {lead.model}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {lead.ram_gb}GB RAM • {lead.storage_gb}GB Storage
              </CardDescription>
            </div>
            <Badge
              className={`${getStatusColor(lead.status)} text-xs px-2 py-0.5`}
            >
              {lead.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-gray-500">AI Estimated Price</div>
            <div className="text-xl font-bold text-green-600">
              {formatPrice(lead.ai_estimated_price || lead.final_quoted_price)}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Customer</div>
            <div className="font-medium text-sm">{lead.customer_name}</div>
          </div>

          {lead.agent_name && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Assigned Agent</div>
              <div className="font-medium text-sm">{lead.agent_name}</div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-8"
              onClick={() => navigate(`/partner/lead/${lead.id}`)}
            >
              View Details
            </Button>
            {showLockButton && (
              <Button
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={() => navigate(`/partner/lead/${lead.id}`)}
              >
                Lock Lead
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
        <div className="container mx-auto px-4 py-6">
          {/* Custom Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 p-1 bg-white rounded-lg shadow-sm border border-gray-200 w-fit">
              {[
                {
                  key: "lead_locked",
                  label: "Locked Deals",
                  count: leadLockedDeals.length,
                },
                {
                  key: "lead_purchased",
                  label: "Purchased",
                  count: leadPurchasedOrders.length,
                },
                {
                  key: "accepted_by_agent",
                  label: "In Progress",
                  count: acceptedByAgentLeads.length,
                },
                {
                  key: "pickup_completed",
                  label: "Completed",
                  count: completedOrders.length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === tab.key
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-md"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {tab.label}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        activeTab === tab.key
                          ? "bg-white/20"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "lead_locked" && (
              <motion.div
                key="lead_locked"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                  </div>
                ) : leadLockedDeals.length === 0 ? (
                  <Card className="border-dashed">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leadLockedDeals.map((lead) => (
                      <motion.div
                        key={lead.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="hover:shadow-xl transition-all duration-300 border-2 border-purple-200 hover:-translate-y-1">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base font-semibold">
                                  {lead.brand} {lead.model}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {lead.ram_gb}GB RAM • {lead.storage_gb}GB
                                  Storage
                                </CardDescription>
                              </div>
                              <Badge className="bg-purple-500 text-xs px-2 py-0.5">
                                Locked
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <div className="text-xs text-gray-500">Price</div>
                              <div className="text-xl font-bold text-green-600">
                                {formatPrice(
                                  lead.ai_estimated_price ||
                                    lead.final_quoted_price,
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-gray-500">
                                Lead Cost
                              </div>
                              <div className="text-base font-semibold text-orange-600">
                                {formatPrice(lead.lead_cost || 0)}
                              </div>
                            </div>

                            {lead.time_remaining && lead.time_remaining > 0 && (
                              <div>
                                <div className="text-xs text-gray-500">
                                  Time Remaining
                                </div>
                                <div className="text-sm font-medium text-red-600">
                                  {Math.floor(lead.time_remaining / 60)} min{" "}
                                  {Math.floor(lead.time_remaining % 60)} sec
                                </div>
                              </div>
                            )}

                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Customer
                              </div>
                              <div className="font-medium text-sm">
                                {lead.customer_name}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Location
                              </div>
                              <div className="text-xs">
                                {lead.pickup_city}, {lead.pickup_state} -{" "}
                                {lead.pickup_pincode}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs h-8"
                                onClick={() =>
                                  navigate(`/partner/lead/${lead.id}`)
                                }
                              >
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                                onClick={() =>
                                  handlePurchaseLockedDeal(lead.id)
                                }
                              >
                                Purchase
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "lead_purchased" && (
              <motion.div
                key="lead_purchased"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                  </div>
                ) : leadPurchasedOrders.length === 0 ? (
                  <Card className="border-dashed">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leadPurchasedOrders.map((lead) => (
                      <motion.div
                        key={lead.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base font-semibold">
                                  {lead.brand} {lead.model}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {lead.ram_gb}GB RAM • {lead.storage_gb}GB
                                  Storage
                                </CardDescription>
                              </div>
                              <Badge className="bg-green-500 text-xs px-2 py-0.5">
                                Purchased
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <div className="text-xs text-gray-500">Price</div>
                              <div className="text-xl font-bold text-green-600">
                                {formatPrice(
                                  lead.ai_estimated_price ||
                                    lead.final_quoted_price,
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Customer
                              </div>
                              <div className="font-medium text-sm">
                                {lead.customer_name}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Location
                              </div>
                              <div className="text-xs">
                                {lead.pickup_city}, {lead.pickup_state} -{" "}
                                {lead.pickup_pincode}
                              </div>
                            </div>

                            {assigningOrder === lead.id ? (
                              <div className="space-y-2">
                                <select
                                  className="w-full border rounded px-3 py-2 text-sm"
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
                                    className="flex-1 text-xs h-8"
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
                                    className="flex-1 text-xs h-8"
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
                                  className="flex-1 text-xs h-8"
                                  onClick={() =>
                                    navigate(`/partner/lead/${lead.id}`)
                                  }
                                >
                                  View Details
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs h-8"
                                  onClick={() => setAssigningOrder(lead.id)}
                                >
                                  Assign Agent
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "accepted_by_agent" && (
              <motion.div
                key="accepted_by_agent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                  </div>
                ) : acceptedByAgentLeads.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-500">No orders in progress</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {acceptedByAgentLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "pickup_completed" && (
              <motion.div
                key="pickup_completed"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                  </div>
                ) : completedOrders.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-500">No completed orders</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedOrders.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Buy Credits Modal */}
      {showBuyModal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowBuyModal(false)}
            ></div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-2xl bg-white rounded-xl p-6 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-2">Buy Credits</h2>
              <p className="text-sm text-gray-500 mb-4">
                Choose a credit plan to purchase
              </p>

              <div className="space-y-3">
                {plans.map((p, index) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-200 hover:border-purple-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-base">
                              {p.plan_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {p.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {p.credit_amount} credits
                            </div>
                            <div className="text-sm text-gray-500">
                              ₹{p.price}
                            </div>
                            <div className="mt-2">
                              <Button
                                size="sm"
                                className="text-xs h-8"
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
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 text-right">
                <Button
                  variant="outline"
                  onClick={() => setShowBuyModal(false)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}
