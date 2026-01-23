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

interface Order {
  id: number;
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
  status: string;
  pickup_date?: string;
  pickup_time?: string;
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
      setCurrentOrders(
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
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    setActionLoading(true);
    try {
      await api.post(`/agent/orders/${orderId}/accept`);
      await fetchOrders();
      alert("Order accepted successfully!");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to accept order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to reject this order?")) {
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/agent/orders/${orderId}/reject`);
      await fetchOrders();
      alert("Order rejected");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to reject order");
    } finally {
      setActionLoading(false);
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
      assigned_to_agent: "bg-yellow-500",
      accepted_by_agent: "bg-green-500",
      pickup_scheduled: "bg-teal-500",
      pickup_completed: "bg-indigo-500",
      payment_processed: "bg-emerald-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const OrderCard = ({
    order,
    showActions,
  }: {
    order: Order;
    showActions?: boolean;
  }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {order.brand} {order.model}
            </CardTitle>
            <CardDescription>
              {order.ram_gb}GB RAM • {order.storage_gb}GB Storage
            </CardDescription>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {order.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-500">Estimated Value</div>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(
                order.ai_estimated_price || order.final_quoted_price,
              )}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">Customer</div>
            <div className="font-medium">{order.customer_name}</div>
            <div className="text-sm text-gray-600">{order.customer_phone}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">Address</div>
            <div className="text-sm">
              {order.pickup_address_line}, {order.pickup_city},{" "}
              {order.pickup_state} - {order.pickup_pincode}
            </div>
          </div>

          {order.pickup_date && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Pickup Schedule</div>
              <div className="font-medium">
                {new Date(order.pickup_date).toLocaleDateString()} -{" "}
                {order.pickup_time || "TBD"}
              </div>
            </div>
          )}

          {showActions && (
            <div className="flex gap-2 pt-2">
              {order.status === "assigned_to_agent" && (
                <>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAcceptOrder(order.id)}
                    disabled={actionLoading}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleRejectOrder(order.id)}
                    disabled={actionLoading}
                  >
                    Reject
                  </Button>
                </>
              )}
              {(order.status === "accepted_by_agent" ||
                order.status === "pickup_scheduled") && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedOrder(order)}
                >
                  View Details
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Header
        pageTitle="Agent Dashboard"
        userName={user?.name}
        showLogout={true}
        onLogout={handleLogout}
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="current">
                Current Orders ({currentOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : currentOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">No current orders assigned</p>
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
                <div className="text-center py-12">Loading...</div>
              ) : completedOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">No completed orders</p>
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
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>Order Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-500">Phone</Label>
                  <div className="text-lg font-semibold">
                    {selectedOrder.brand} {selectedOrder.model}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedOrder.ram_gb}GB RAM • {selectedOrder.storage_gb}GB
                    Storage
                  </div>
                </div>

                <div>
                  <Label className="text-gray-500">Customer Name</Label>
                  <div className="font-semibold">
                    {selectedOrder.customer_name}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-500">Customer Phone</Label>
                  <div className="font-semibold">
                    {selectedOrder.customer_phone}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-500">Pickup Address</Label>
                  <div className="font-semibold">
                    {selectedOrder.pickup_address_line},{" "}
                    {selectedOrder.pickup_city}, {selectedOrder.pickup_state} -{" "}
                    {selectedOrder.pickup_pincode}
                  </div>
                </div>

                {selectedOrder.pickup_date && (
                  <div>
                    <Label className="text-gray-500">Scheduled Pickup</Label>
                    <div className="font-semibold">
                      {new Date(selectedOrder.pickup_date).toLocaleDateString()}
                      {" at "}
                      {selectedOrder.pickup_time || "TBD"}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-gray-500">Estimated Price</Label>
                  <div className="text-2xl font-bold text-green-600">
                    {formatPrice(
                      selectedOrder.ai_estimated_price ||
                        selectedOrder.final_quoted_price,
                    )}
                  </div>
                </div>

                {/* Conditional Form */}
                {selectedOrder.status === "accepted_by_agent" && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold">Schedule Pickup</h3>

                    <div>
                      <Label htmlFor="scheduled_date">Pickup Date</Label>
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

                    <div>
                      <Label htmlFor="scheduled_time">Pickup Time</Label>
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

                    <div>
                      <Label htmlFor="schedule_notes">Notes (Optional)</Label>
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
                    <h3 className="font-semibold">Complete Pickup Details</h3>

                    <div>
                      <Label htmlFor="actual_condition">Actual Condition</Label>
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

                    <div>
                      <Label htmlFor="final_offered_price">
                        Final Offered Price (₹)
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

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="customer_accepted"
                        checked={pickupForm.customer_accepted}
                        onChange={(e) =>
                          setPickupForm((prev) => ({
                            ...prev,
                            customer_accepted: e.target.checked,
                          }))
                        }
                      />
                      <Label htmlFor="customer_accepted">
                        Customer accepted the offer
                      </Label>
                    </div>

                    <div>
                      <Label htmlFor="pickup_notes">
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

                    <div>
                      <Label htmlFor="payment_method">
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

                <div className="flex gap-3 pt-4">
                  {selectedOrder.status === "accepted_by_agent" && (
                    <Button
                      className="flex-1"
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
                      className="flex-1"
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
