import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
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
  id: string;
  phone: {
    name: string;
    variant: string;
    condition: string;
    price: number;
  };
  status: "pending" | "in-progress" | "completed";
  createdAt: string;
  customerName: string;
  address: string;
  pickupDate: string;
  paymentMethod: string;
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "pending" | "in-progress" | "completed"
  >("all");

  useEffect(() => {
    if (!isLoggedIn || user?.role !== "agent") {
      navigate("/agent/login");
      return;
    }

    // Load orders from localStorage
    const savedOrders = JSON.parse(localStorage.getItem("agentOrders") || "[]");
    setOrders(savedOrders);
  }, [isLoggedIn, user, navigate]);

  const filteredOrders = orders.filter((order) =>
    selectedFilter === "all" ? true : order.status === selectedFilter
  );

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    completed: orders.filter((o) => o.status === "completed").length,
    earnings: orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + o.phone.price * 0.05, 0),
  };

  const updateOrderStatus = (
    orderId: string,
    newStatus: "pending" | "in-progress" | "completed"
  ) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem("agentOrders", JSON.stringify(updatedOrders));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "in-progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

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
                {user?.name}
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
                value: stats.pending,
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
              { value: "in-progress", label: "In Progress" },
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
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                            {order.phone.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1).replace("-", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {order.phone.variant} • {order.phone.condition}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {order.customerName}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {order.address}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(order.pickupDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Offer Price</p>
                        <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                          ₹{order.phone.price.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateOrderStatus(order.id, "in-progress")
                            }
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            Start Pickup
                          </Button>
                        )}
                        {order.status === "in-progress" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateOrderStatus(order.id, "completed")
                            }
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          >
                            Complete
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
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
