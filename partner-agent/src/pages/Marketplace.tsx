import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

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
      alert("Failed to load leads");
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
      alert(err.response?.data?.detail || "Failed to lock lead");
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
      alert(err.response?.data?.detail || "Failed to purchase lead");
    } finally {
      setActionLoading(false);
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
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {lead.brand} {lead.model}
                    </CardTitle>
                    <Badge>{lead.status || "lead"}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500">
                        Estimated Value
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 0,
                        }).format(lead.ai_estimated_price || lead.quoted_price)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500 mb-1">Pickup</div>
                      <div className="text-sm">
                        {lead.pickup_city || ""}, {lead.pickup_state || ""} -{" "}
                        {lead.pickup_pincode}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {!lead.is_locked && (
                        <Button
                          onClick={() => lockLead(lead.order_id)}
                          disabled={actionLoading}
                        >
                          Lock
                        </Button>
                      )}
                      {lead.is_locked && !lead.locked_by_me && (
                        <Button variant="outline" disabled>
                          Locked
                        </Button>
                      )}
                      {lead.locked_by_me && (
                        <Button
                          onClick={() => purchaseLead(lead.order_id)}
                          disabled={actionLoading}
                        >
                          Purchase
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
    </div>
  );
}
