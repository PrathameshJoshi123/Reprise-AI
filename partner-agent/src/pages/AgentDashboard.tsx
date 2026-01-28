import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { formatPrice } from "../lib/utils";
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
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Package,
  IndianRupee,
  CheckCircle2,
  Eye,
} from "lucide-react";

interface Order {
  id?: number;
  phone_name?: string;
  specs?: string;
  status: string;
  estimated_value?: string | number;
  customer?: string;
  customer_name?: string;
  phone?: string;
  customer_phone?: string;
  pickup_address?: string;
  pickup_address_line?: string;
  pickup_city?: string;
  pickup_state?: string;
  pickup_pincode?: string;
  pickup_schedule_date?: string;
  pickup_date?: string | Date;
  pickup_schedule_time?: string;
  pickup_time?: string;
  payment_mode?: string;
  payment_method?: string;
  // Legacy fields (keeping for backward compatibility)
  customer_email?: string;
  agent_name?: string;
  agent_id?: number;
  brand?: string;
  model?: string;
  ram_gb?: number;
  storage_gb?: number;
  ai_estimated_price?: number;
  final_quoted_price?: number;
  ai_reasoning?: string;
  accepted_at?: string;
  completed_at?: string;
}

export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pickupForm, setPickupForm] = useState({
    actual_condition: "",
    final_offered_price: 0,
    customer_accepted: false,
    pickup_notes: "",
    payment_method: "",
  });
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_date: "",
    scheduled_time: "",
    notes: "",
  });

  // Helper function to parse DD/MM/YYYY date format
  const parseDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === "string") {
      const parts = dateInput.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      return new Date(dateInput); // Fallback for other formats
    }
    return null;
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      if (selectedOrder.status === "accepted_by_agent") {
        setScheduleForm({
          scheduled_date: "",
          scheduled_time: "",
          notes: "",
        });
      } else if (selectedOrder.status === "pickup_scheduled") {
        setPickupForm({
          actual_condition: "",
          final_offered_price:
            selectedOrder.ai_estimated_price ||
            selectedOrder.final_quoted_price ||
            0,
          customer_accepted: false,
          pickup_notes: "",
          payment_method: "",
        });
      }
    }
  }, [selectedOrder]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/agent/orders");
      const orders: Order[] = response.data;

      // Filter orders into current and completed
      // Normalize status for comparison (handle both spaces and underscores)
      setCurrentOrders(
        orders.filter((order) => {
          const normalizedStatus = order.status
            .toLowerCase()
            .replace(/ /g, "_");
          return (
            normalizedStatus === "accepted_by_agent" ||
            normalizedStatus === "pickup_scheduled"
          );
        }),
      );

      setCompletedOrders(
        orders.filter((order) => {
          const normalizedStatus = order.status
            .toLowerCase()
            .replace(/ /g, "_");
          return (
            normalizedStatus === "pickup_completed" ||
            normalizedStatus === "payment_processed" ||
            normalizedStatus === "completed"
          );
        }),
      );
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePickup = async () => {
    if (!confirm("Confirm pickup completion?")) {
      return;
    }

    setActionLoading(true);
    try {
      await api.post(
        `/agent/orders/${selectedOrder!.id}/complete-pickup`,
        pickupForm,
      );
      await fetchOrders();
      setSelectedOrder(null);
      setPickupForm({
        actual_condition: "",
        final_offered_price: 0,
        customer_accepted: false,
        pickup_notes: "",
        payment_method: "",
      });
      alert("Pickup completed successfully!");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to complete pickup");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedulePickup = async () => {
    setActionLoading(true);
    try {
      await api.post(
        `/agent/orders/${selectedOrder!.id}/schedule-pickup`,
        scheduleForm,
      );
      await fetchOrders();
      setSelectedOrder(null);
      setScheduleForm({
        scheduled_date: "",
        scheduled_time: "",
        notes: "",
      });
      alert("Pickup scheduled successfully!");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to schedule pickup");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      accepted_by_agent: "bg-green-100 text-green-800 border border-green-200",
      pickup_scheduled: "bg-blue-100 text-blue-800 border border-blue-200",
      pickup_completed:
        "bg-purple-100 text-purple-800 border border-purple-200",
      payment_processed:
        "bg-emerald-100 text-emerald-800 border border-emerald-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border border-gray-200";
  };

  const OrderCard = ({
    order,
    showActions,
  }: {
    order: Order;
    showActions?: boolean;
  }) => {
    // Helper functions to get values from either new or legacy fields
    const getPhoneName = () =>
      order.phone_name || `${order.brand || ""} ${order.model || ""}`.trim();
    const getSpecs = () =>
      order.specs ||
      `${order.ram_gb || 0}GB RAM • ${order.storage_gb || 0}GB Storage`;
    const getCustomerName = () => order.customer || order.customer_name || "";
    const getCustomerPhone = () => order.phone || order.customer_phone || "";
    const getPickupAddress = () =>
      order.pickup_address ||
      `${order.pickup_address_line || ""}, ${order.pickup_city || ""}, ${order.pickup_state || ""} - ${order.pickup_pincode || ""}`.trim();
    const getEstimatedValue = () => {
      if (order.estimated_value) return order.estimated_value;
      const price = order.ai_estimated_price || order.final_quoted_price || 0;
      return formatPrice(price);
    };
    const getPickupDate = () =>
      order.pickup_schedule_date ||
      (order.pickup_date
        ? parseDate(order.pickup_date)?.toLocaleDateString()
        : "");
    const getPickupTime = () =>
      order.pickup_schedule_time || order.pickup_time || "TBD";
    const getPaymentMethod = () => {
      if (order.payment_mode) {
        return order.payment_mode.replace("payment mode - ", "");
      }
      return order.payment_method || "";
    };

    return (
      <Card className="hover:shadow-lg transition-all duration-200 border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-gray-600" />
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {getPhoneName()}
                </CardTitle>
              </div>
              <CardDescription className="text-sm">
                {getSpecs()}
              </CardDescription>
            </div>
            <Badge
              className={`${getStatusColor(order.status)} px-2.5 py-0.5 text-xs font-medium`}
            >
              {order.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee className="w-4 h-4 text-green-700" />
                <div className="text-xs font-medium text-green-700">
                  Estimated Value
                </div>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {getEstimatedValue()}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-md border">
                <User className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-0.5">Customer</div>
                  <div className="font-medium text-gray-900 text-sm">
                    {getCustomerName()}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <div className="text-xs text-gray-600">
                      {getCustomerPhone()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-md border">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-0.5">
                    Pickup Address
                  </div>
                  <div className="text-xs text-gray-700">
                    {getPickupAddress()}
                  </div>
                </div>
              </div>

              {getPickupDate() && (
                <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-md border">
                  <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Pickup Schedule
                    </div>
                    <div className="font-medium text-gray-900 flex items-center gap-1.5 text-sm">
                      {getPickupDate()}
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {getPickupTime()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {getPaymentMethod() && (
                <div className="flex items-start gap-2 p-2.5 bg-green-50 rounded-md border border-green-200">
                  <IndianRupee className="w-4 h-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-green-700 mb-0.5">
                      Payment Method
                    </div>
                    <div className="font-medium text-gray-900 text-sm">
                      {getPaymentMethod()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {showActions && (
              <div className="flex gap-2 pt-2 border-t">
                {(order.status === "accepted_by_agent" ||
                  order.status === "pickup_scheduled") && (
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    {order.status === "accepted_by_agent"
                      ? "Schedule Pickup"
                      : "View Details"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Header
        pageTitle="Agent Dashboard"
        userName={user?.name}
        showLogout={true}
        onLogout={handleLogout}
      />
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white p-1 border">
              <TabsTrigger
                value="current"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Current Orders ({currentOrders.length})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Completed ({completedOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
                  <p className="mt-3 text-gray-600">Loading orders...</p>
                </div>
              ) : currentOrders.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="py-12 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No current orders assigned
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      New orders will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentOrders.map((order) => (
                    <OrderCard key={order.id} order={order} showActions />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
                  <p className="mt-3 text-gray-600">Loading orders...</p>
                </div>
              ) : completedOrders.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No completed orders
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Completed orders will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
              <CardHeader className="bg-gray-50 border-b sticky top-0 z-10">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">Order Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-gray-600" />
                    <Label className="text-gray-700 font-medium">Device</Label>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedOrder.brand && selectedOrder.model
                      ? `${selectedOrder.brand} ${selectedOrder.model}`
                      : selectedOrder.phone_name || "Device"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedOrder.ram_gb}GB RAM • {selectedOrder.storage_gb}GB
                    Storage
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <Label className="text-gray-600 text-xs">
                        Customer Name
                      </Label>
                    </div>
                    <div className="font-medium text-gray-900 text-sm">
                      {selectedOrder.customer_name ||
                        selectedOrder.customer ||
                        "-"}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <Label className="text-gray-600 text-xs">
                        Customer Phone
                      </Label>
                    </div>
                    <div className="font-medium text-gray-900 text-sm">
                      {selectedOrder.customer_phone ||
                        selectedOrder.phone ||
                        "-"}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <Label className="text-gray-700 font-medium text-sm">
                      Pickup Address
                    </Label>
                  </div>
                  <div className="text-sm text-gray-900">
                    {selectedOrder.pickup_address ||
                      `${selectedOrder.pickup_address_line || ""}, ${selectedOrder.pickup_city || ""}, ${selectedOrder.pickup_state || ""} - ${selectedOrder.pickup_pincode || ""}`.trim() ||
                      "-"}
                  </div>
                </div>

                {(selectedOrder.pickup_date ||
                  selectedOrder.pickup_schedule_date) && (
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <Label className="text-gray-700 font-medium text-sm">
                        Scheduled Pickup
                      </Label>
                    </div>
                    <div className="font-medium text-gray-900 flex items-center gap-2 text-sm">
                      {(selectedOrder.pickup_date
                        ? parseDate(
                            selectedOrder.pickup_date,
                          )?.toLocaleDateString()
                        : selectedOrder.pickup_schedule_date) || "-"}
                      <Clock className="w-3 h-3 text-gray-500" />
                      {selectedOrder.pickup_time ||
                        selectedOrder.pickup_schedule_time ||
                        "TBD"}
                    </div>
                  </div>
                )}

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee className="w-4 h-4 text-green-700" />
                    <Label className="text-green-700 font-medium text-sm">
                      Estimated Price
                    </Label>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {formatPrice(
                      selectedOrder.ai_estimated_price ||
                        selectedOrder.final_quoted_price,
                    )}
                  </div>
                </div>

                {/* Conditional Form */}
                {selectedOrder.status === "accepted_by_agent" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <h3 className="font-semibold text-base text-gray-900">
                        Schedule Pickup
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="scheduled_date"
                        className="text-gray-700 font-medium text-sm"
                      >
                        Pickup Date
                      </Label>
                      <Input
                        id="scheduled_date"
                        type="date"
                        value={scheduleForm.scheduled_date}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            scheduled_date: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="scheduled_time"
                        className="text-gray-700 font-medium text-sm"
                      >
                        Pickup Time
                      </Label>
                      <Input
                        id="scheduled_time"
                        type="time"
                        value={scheduleForm.scheduled_time}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            scheduled_time: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="schedule_notes"
                        className="text-gray-700 font-medium text-sm"
                      >
                        Notes (Optional)
                      </Label>
                      <Textarea
                        id="schedule_notes"
                        value={scheduleForm.notes}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Any notes for scheduling"
                      />
                    </div>
                  </div>
                )}

                {selectedOrder.status === "pickup_scheduled" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-600" />
                      <h3 className="font-semibold text-base text-gray-900">
                        Complete Pickup Details
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="actual_condition"
                        className="text-gray-700 font-medium text-sm"
                      >
                        Actual Condition
                      </Label>
                      <select
                        id="actual_condition"
                        className="w-full p-2 border rounded-md"
                        value={pickupForm.actual_condition}
                        onChange={(e) =>
                          setPickupForm((prev) => ({
                            ...prev,
                            actual_condition: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select condition</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="final_offered_price"
                        className="text-gray-700 font-medium text-sm"
                      >
                        Final Offered Price
                      </Label>
                      <Input
                        id="final_offered_price"
                        type="number"
                        value={pickupForm.final_offered_price}
                        onChange={(e) =>
                          setPickupForm((prev) => ({
                            ...prev,
                            final_offered_price:
                              parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="Enter final price"
                      />
                    </div>

                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md border">
                      <input
                        type="checkbox"
                        id="customer_accepted"
                        className="w-4 h-4 rounded"
                        checked={pickupForm.customer_accepted}
                        onChange={(e) =>
                          setPickupForm((prev) => ({
                            ...prev,
                            customer_accepted: e.target.checked,
                          }))
                        }
                      />
                      <Label
                        htmlFor="customer_accepted"
                        className="text-gray-700 font-medium text-sm cursor-pointer"
                      >
                        Customer accepted the offer
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="pickup_notes"
                        className="text-gray-700 font-medium text-sm"
                      >
                        Pickup Notes (Optional)
                      </Label>
                      <Textarea
                        id="pickup_notes"
                        value={pickupForm.pickup_notes}
                        onChange={(e) =>
                          setPickupForm((prev) => ({
                            ...prev,
                            pickup_notes: e.target.value,
                          }))
                        }
                        placeholder="Any additional notes about the pickup"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="payment_method"
                        className="text-gray-700 font-medium text-sm"
                      >
                        Payment Method (Optional)
                      </Label>
                      <select
                        id="payment_method"
                        className="w-full p-2 border rounded-md"
                        value={pickupForm.payment_method}
                        onChange={(e) =>
                          setPickupForm((prev) => ({
                            ...prev,
                            payment_method: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select payment method</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  {selectedOrder.status === "accepted_by_agent" && (
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      size="lg"
                      onClick={handleSchedulePickup}
                      disabled={
                        actionLoading ||
                        !scheduleForm.scheduled_date ||
                        !scheduleForm.scheduled_time
                      }
                    >
                      {actionLoading ? "Processing..." : "Schedule Pickup"}
                    </Button>
                  )}
                  {selectedOrder.status === "pickup_scheduled" && (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="lg"
                      onClick={handleCompletePickup}
                      disabled={
                        actionLoading ||
                        !pickupForm.actual_condition ||
                        pickupForm.final_offered_price <= 0
                      }
                    >
                      {actionLoading ? "Processing..." : "Complete Pickup"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
