import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { handleApiError } from "../lib/errorHandler";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Lead {
  order_id: number;
  phone_name: string;
  brand?: string;
  model?: string;
  ram_gb?: number;
  storage_gb?: number;
  quoted_price: number;
  ai_estimated_price?: number;
  pickup_pincode: string;
  pickup_city?: string;
  pickup_state?: string;
  pickup_date?: string;
  pickup_time?: string;
  is_locked?: boolean;
  locked_by_me?: boolean;
  created_at: string;
  status?: string;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sell-phone/partner/leads/available");
      setLeads(res.data || []);
    } catch (err) {
      console.error("Failed to fetch leads", err);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const lockLead = async (orderId: number) => {
    if (!confirm("Lock this lead for exclusive viewing?")) return;
    setActionLoading(true);
    try {
      await api.post(`/sell-phone/partner/leads/${orderId}/lock`);
      // Redirect to partner dashboard after locking
      navigate("/partner/dashboard");
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const purchaseLead = async (orderId: number) => {
    if (!confirm("Purchase this lead (deduct credits)?")) return;
    setActionLoading(true);
    try {
      await api.post(`/sell-phone/partner/leads/${orderId}/purchase`);
      await fetchLeads();
      alert("Lead purchased successfully");
    } catch (err: any) {
      handleApiError(err, "purchase");
    } finally {
      setActionLoading(false);
    }
  };

  const openBuyModal = async () => {
    try {
      const resp = await api.get("/partner/credit-plans");
      setPlans(resp.data || []);
      setShowBuyModal(true);
    } catch (err) {
      console.error("Failed to load credit plans:", err);
      handleApiError(err);
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
    } catch (err: any) {
      console.error("Purchase failed:", err);
      handleApiError(err, "purchase");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header
        pageTitle="Marketplace"
        showLogout={true}
        onLogout={handleLogout}
        showDashboardButton={true}
        onBuyCredits={openBuyModal}
        additionalContent={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/partner/dashboard")}
            >
              Back
            </Button>
            <Button onClick={fetchLeads}>Refresh</Button>
          </div>
        }
      />
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-gray-500">
            Live leads available for purchase
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">No live leads available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map((lead) => (
              <Card
                key={lead.order_id}
                className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-200 bg-gradient-to-br from-white to-gray-50"
              >
                {/* Decorative Spots */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-100 rounded-full -ml-12 -mb-12 opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-pink-100 rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />

                <CardHeader className="relative z-10 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                        {lead.brand} {lead.model}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        {lead.ram_gb && (
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {lead.ram_gb}GB RAM
                          </span>
                        )}
                        {lead.storage_gb && (
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {lead.storage_gb}GB
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 shadow-sm">
                      {lead.status || "lead"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    {/* Price Section */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-medium text-green-700 uppercase tracking-wide">
                          Estimated Value
                        </span>
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-1">
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 0,
                        }).format(lead.ai_estimated_price || lead.quoted_price)}
                      </div>
                    </div>

                    {/* Location Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                          Pickup Location
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {lead.pickup_city || "City"},{" "}
                        {lead.pickup_state || "State"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        PIN: {lead.pickup_pincode}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {!lead.is_locked && (
                        <Button
                          onClick={() => lockLead(lead.order_id)}
                          disabled={actionLoading}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                        >
                          🔒 Lock Lead
                        </Button>
                      )}
                      {lead.is_locked && !lead.locked_by_me && (
                        <Button
                          variant="outline"
                          disabled
                          className="flex-1 border-2 border-gray-300 text-gray-400"
                        >
                          🔒 Locked by Others
                        </Button>
                      )}
                      {lead.locked_by_me && (
                        <Button
                          onClick={() => purchaseLead(lead.order_id)}
                          disabled={actionLoading}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                        >
                          💳 Purchase Now
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Buy Credits Modal */}
      <AnimatePresence>
        {showBuyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowBuyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Buy Credits
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBuyModal(false)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  {plans.map((p: any) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-all duration-200 hover:border-purple-300">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex-grow">
                              <div className="font-semibold text-base">
                                {p.plan_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {p.description}
                              </div>
                            </div>
                            <div className="text-right w-full sm:w-auto">
                              <div className="text-lg font-bold">
                                {p.credit_amount} credits
                              </div>
                              <div className="text-sm text-gray-500">
                                ₹{p.price}
                              </div>
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  className="text-xs h-8 w-full sm:w-auto"
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
