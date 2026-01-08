import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Package,
  Clock,
  CheckCircle,
  MapPin,
  Phone,
  IndianRupee,
  Calendar,
  Smartphone,
  TrendingUp,
  Users,
  AlertCircle,
  Eye,
} from "lucide-react";

interface Order {
  id: number;
  phone_name: string;
  variant?: string;
  quoted_price: number;
  status: string;
  customer_name?: string;
  phone_number?: string;
  email?: string;
  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pickup_date?: string;
  pickup_time?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  payment_method?: string;
  agent_id?: number;
  agent_name?: string;
  agent_phone?: string;
  accepted_at?: string;
  created_at: string;
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "pending" | "accepted" | "completed"
  >("all");

  useEffect(() => {
    if (!isLoggedIn || user?.role !== "agent") {
      navigate("/agent/login");
      return;
    }
  }, [isLoggedIn, user, navigate]);

  // Fetch agent's orders for stats and list
  const {
    data: myOrders = [],
    isLoading: isMyOrdersLoading,
    error: myOrdersError,
  } = useQuery({
    queryKey: ["agentMyOrders"],
    queryFn: async () => {
      const response = await api.get("/sell-phone/agent/orders");
      return response.data as Order[];
    },
    enabled: !!user && user.role === "agent",
    refetchInterval: 30000,
  });

  // New: Fetch nearby orders only when filter is "all"
  const {
    data: nearbyOrders = [],
    isLoading: isNearbyLoading,
    error: nearbyError,
  } = useQuery({
    queryKey: ["nearbyOrders"],
    queryFn: async () => {
      const response = await api.get("/sell-phone/agent/nearby-orders");
      return response.data as Order[];
    },
    enabled: !!user && user.role === "agent" && selectedFilter === "all",
    refetchInterval: 30000,
  });

  // Mutation for accepting orders (invalidate myOrders)
  const acceptOrderMutation = useMutation({
    mutationFn: (orderId: number) =>
      api.post(`/sell-phone/orders/${orderId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentMyOrders"] });
    },
  });

  const handleAcceptOrder = (orderId: number) => {
    acceptOrderMutation.mutate(orderId);
  };

  // Filter myOrders for the list based on selectedFilter, and combine with nearbyOrders for "all"
  let filteredOrders = myOrders.filter((order) =>
    selectedFilter === "all" ? true : order.status === selectedFilter
  );
  if (selectedFilter === "all") {
    filteredOrders = [...filteredOrders, ...nearbyOrders];
  }

  // Compute stats from myOrders
  const stats = {
    total: myOrders.length,
    pendingPickups: myOrders.filter((o) => o.status === "accepted").length, // accepted but pickup pending
    completed: myOrders.filter((o) => o.status === "completed").length,
    earnings: myOrders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + (o.quoted_price ?? 0) * 0.05, 0),
  };

  // Fetch current user details from /me
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await api.get("/auth/me");
      return response.data;
    },
    enabled: !!user && user.role === "agent",
  });

  // Loading/error combined, including nearby when applicable
  const isLoading =
    isMyOrdersLoading || isUserLoading || (selectedFilter === "all" && isNearbyLoading);
  const error = myOrdersError || (selectedFilter === "all" && nearbyError);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "accepted":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-600">
            Failed to load orders. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {currentUser?.full_name ?? "Agent"}
              </span>
            </h1>
            <p className="text-gray-500 mt-1">
              Here's what's happening with your pickups today.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Orders",
                value: stats.total,
                icon: Package,
                color: "from-blue-500 to-indigo-600",
                bgColor: "bg-blue-50",
              },
              {
                label: "Pending Pickups",
                value: stats.pendingPickups,
                icon: Clock,
                color: "from-yellow-500 to-orange-500",
                bgColor: "bg-yellow-50",
              },
              {
                label: "Completed",
                value: stats.completed,
                icon: CheckCircle,
                color: "from-green-500 to-emerald-600",
                bgColor: "bg-green-50",
              },
              {
                label: "Total Earnings",
                value: `₹${stats.earnings.toLocaleString()}`,
                icon: IndianRupee,
                color: "from-purple-500 to-pink-500",
                bgColor: "bg-purple-50",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}
                  >
                    <stat.icon
                      size={24}
                      className={`text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}
                      style={{
                        color: stat.color.includes("blue")
                          ? "#3b82f6"
                          : stat.color.includes("yellow")
                          ? "#f59e0b"
                          : stat.color.includes("green")
                          ? "#10b981"
                          : "#a855f7",
                      }}
                    />
                  </div>
                  <TrendingUp size={16} className="text-green-500" />
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { value: "all", label: "All Orders" },
              { value: "pending", label: "Pending" },
              { value: "accepted", label: "Accepted" },
              { value: "completed", label: "Completed" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedFilter === filter.value
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Package size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No orders yet
                </h3>
                <p className="text-gray-500">
                  New pickup orders will appear here when customers complete
                  their checkout.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Smartphone size={28} className="text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {order.phone_name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {order.variant ?? "-"}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {order.customer_name ?? "Unknown"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {[
                              order.address_line,
                              order.city,
                              order.state,
                              order.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {order.pickup_date
                              ? new Date(order.pickup_date).toLocaleDateString()
                              : "TBD"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Quoted Price</p>
                        <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                          ₹{order.quoted_price.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleAcceptOrder(order.id)}
                            disabled={acceptOrderMutation.isLoading}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            {acceptOrderMutation.isLoading
                              ? "Accepting..."
                              : "Accept Order"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-2"
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
