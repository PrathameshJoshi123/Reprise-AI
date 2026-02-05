import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LeadDetail {
  order_id: number;
  phone_name: string;
  brand?: string;
  model?: string;
  ram_gb?: number;
  storage_gb?: number;
  variant?: string;
  quoted_price: number;
  final_quoted_price?: number;
  ai_estimated_price?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  pickup_address_line?: string;
  pickup_city?: string;
  pickup_state?: string;
  pickup_pincode?: string;
  pickup_date?: string;
  pickup_time?: string;
  status: string;
  lead_cost_estimate?: number;
  lock_expires_at?: string;
  created_at: string;
}

export default function LeadPurchaseConfirmation() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { logout } = useAuth();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [leadCost, setLeadCost] = useState<number>(0);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    fetchLeadDetail();
    fetchPartnerProfile();
  }, [id]);

  const fetchLeadDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/sell-phone/partner/leads/${id}`);
      setLead(res.data);
      // Calculate estimated lead cost (using backend logic: admin percentage of quoted price)
      const price = res.data.final_quoted_price || res.data.quoted_price || 0;
      // Assuming 10% lead cost (you can fetch this from admin config endpoint if available)
      const estimatedCost = price * 0.1;
      setLeadCost(estimatedCost);
    } catch (err: any) {
      console.error("Failed to fetch lead detail", err);
      handleApiError(err);
      navigate("/partner/marketplace");
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerProfile = async () => {
    try {
      const res = await api.get("/partner/profile");
      setCreditBalance(res.data.credit_balance || 0);
    } catch (err) {
      console.error("Failed to fetch partner profile", err);
      handleApiError(err);
    }
  };

  const handlePurchase = async () => {
    if (!id) return;

    if (creditBalance < leadCost) {
      alert("Insufficient credits. Please purchase more credits.");
      return;
    }

    if (!confirm(`Purchase this lead for ₹${leadCost.toFixed(2)} credits?`)) {
      return;
    }

    setPurchasing(true);
    try {
      const res = await api.post(`/sell-phone/partner/leads/${id}/purchase`);
      alert(
        `Lead purchased successfully! Credits deducted: ₹${res.data.credits_deducted}`,
      );
      navigate("/partner/dashboard");
    } catch (err: any) {
      handleApiError(err, "purchase");
    } finally {
      setPurchasing(false);
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

  const handleUnlock = async () => {
    if (!id) return;
    if (!confirm("Unlock this lead and return it to marketplace?")) return;

    try {
      await api.delete(`/sell-phone/partner/leads/${id}/unlock`);
      alert("Lead unlocked successfully");
      navigate("/partner/marketplace");
    } catch (err: any) {
      handleApiError(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading lead details...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Lead not found</div>
      </div>
    );
  }

  const sufficientCredits = creditBalance >= leadCost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header
        pageTitle="Purchase Lead"
        showLogout={true}
        onLogout={handleLogout}
        showDashboardButton={true}
        onBuyCredits={openBuyModal}
        additionalContent={
          <Button
            variant="outline"
            onClick={() => navigate("/partner/marketplace")}
          >
            Back to Marketplace
          </Button>
        }
      />
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-gray-500">
            Review details and confirm purchase
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Credit Balance & Cost Summary */}
          <Card
            className={
              sufficientCredits
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {sufficientCredits ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                Credit Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Your Balance</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    }).format(creditBalance)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Lead Cost</div>
                  <div className="text-2xl font-bold text-orange-600">
                    -{" "}
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    }).format(leadCost)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    After Purchase
                  </div>
                  <div
                    className={`text-2xl font-bold ${sufficientCredits ? "text-green-600" : "text-red-600"}`}
                  >
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    }).format(creditBalance - leadCost)}
                  </div>
                </div>
              </div>

              {!sufficientCredits && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    Insufficient credits to purchase this lead. Please{" "}
                    <button
                      onClick={() => navigate("/partner/dashboard")}
                      className="underline font-semibold"
                    >
                      buy more credits
                    </button>{" "}
                    first.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lead Details</CardTitle>
                <Badge>{lead.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Phone Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">
                        Brand & Model:
                      </span>
                      <div className="font-medium">
                        {lead.brand} {lead.model}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Specs:</span>
                      <div className="font-medium">
                        {lead.ram_gb}GB RAM, {lead.storage_gb}GB Storage
                        {lead.variant && ` - ${lead.variant}`}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">
                        Quoted Price:
                      </span>
                      <div className="text-xl font-bold text-green-600">
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 0,
                        }).format(lead.final_quoted_price || lead.quoted_price)}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Customer & Pickup
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Customer:</span>
                      <div className="font-medium">
                        {lead.customer_name || "N/A"}
                      </div>
                      <div className="text-sm">
                        {lead.customer_phone || "N/A"}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">
                        Pickup Address:
                      </span>
                      <div className="font-medium">
                        {lead.pickup_address_line || "N/A"}
                      </div>
                      <div className="text-sm">
                        {lead.pickup_city}, {lead.pickup_state} -{" "}
                        {lead.pickup_pincode}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">
                        Pickup Schedule:
                      </span>
                      <div className="font-medium">
                        {lead.pickup_date && lead.pickup_time
                          ? `${new Date(lead.pickup_date).toLocaleDateString()} at ${lead.pickup_time}`
                          : "Not scheduled"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={handleUnlock}
              disabled={purchasing}
            >
              Unlock & Return
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={purchasing || !sufficientCredits}
              className="bg-green-600 hover:bg-green-700"
            >
              {purchasing
                ? "Processing..."
                : `Confirm Purchase (₹${leadCost.toFixed(0)})`}
            </Button>
          </div>
        </div>
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
