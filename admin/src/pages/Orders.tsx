import { useEffect, useState } from "react";
import api from "../lib/api";
import { formatDateTime, formatCurrency } from "../lib/utils";
import { getOrderStatusColor } from "../lib/badgeUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { SimpleDropdown } from "../components/SimpleDropdown";

interface Order {
  id: number;
  phone_name: string;
  customer_name: string;
  partner_name: string;
  agent_name: string;
  status: string;
  quoted_price: number;
  created_at: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params: any = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await api.get("/admin/orders", { params });
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pickup_completed: "PICKED UP",
      picked_up: "PICKED UP",
      lead_created: "PENDING",
      pending: "PENDING",
      confirmed: "CONFIRMED",
      cancelled: "CANCELLED",
      completed: "COMPLETED",
    };
    
    return statusMap[status] || status.replace(/_/g, " ").toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={getOrderStatusColor(status)} variant="outline">
        {getStatusLabel(status)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Monitor all orders in the system
          </p>
        </div>
        <SimpleDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All Orders" },
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "pickup_completed", label: "Picked Up" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          className="w-48"
        />
      </div>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>{orders.length} order(s) found</CardDescription>
        </CardHeader>
        <CardContent className="overflow-visible">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>{order.phone_name}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>{order.partner_name || "-"}</TableCell>
                      <TableCell>{order.agent_name || "-"}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(order.quoted_price)}
                      </TableCell>
                      <TableCell>{formatDateTime(order.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
