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
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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

interface PaginatedResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_more: boolean;
}

type SortBy = "created_at" | "quoted_price" | "status";
type SortOrder = "asc" | "desc";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    setPage(1); // Reset to first page when filter changes
  }, [statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page, limit, sortBy, sortOrder, startDate, endDate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }
      const response = await api.get<PaginatedResponse>("/admin/orders", {
        params,
      });

      // Handle both paginated response and legacy array response
      if (Array.isArray(response.data)) {
        setOrders(response.data);
        setTotal(response.data.length);
        setTotalPages(1);
      } else {
        setOrders(response.data.items || []);
        setTotal(response.data.total || 0);
        setTotalPages(response.data.total_pages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      lead_created: "LEAD CREATED",
      available_for_partners: "AVAILABLE",
      lead_locked: "LOCKED",
      lead_purchased: "PURCHASED",
      accepted_by_agent: "AGENT ASSIGNED",
      assigned_to_agent: "AGENT REASSIGNED",
      pickup_scheduled: "PICKUP SCHEDULED",
      pickup_completed: "PICKED UP",
      pickup_completed_declined: "PICKUP DECLINED",
      payment_processed: "PAYMENT PROCESSED",
      cancelled: "CANCELLED",
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

  const toggleSortOrder = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getSortIndicator = (field: SortBy) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  if (loading && orders.length === 0) {
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
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <SimpleDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All Orders" },
                  { value: "lead_created", label: "Lead Created" },
                  { value: "available_for_partners", label: "Available" },
                  { value: "lead_locked", label: "Locked" },
                  { value: "lead_purchased", label: "Purchased" },
                  { value: "accepted_by_agent", label: "Agent Assigned" },
                  { value: "assigned_to_agent", label: "Agent Reassigned" },
                  { value: "pickup_scheduled", label: "Pickup Scheduled" },
                  { value: "pickup_completed", label: "Picked Up" },
                  {
                    value: "pickup_completed_declined",
                    label: "Pickup Declined",
                  },
                  { value: "payment_processed", label: "Payment Processed" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
                className="w-full"
              />
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all");
                  setStartDate("");
                  setEndDate("");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            Showing {orders?.length || 0} of {total} order(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-visible">
          {!orders || orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No orders found
            </div>
          ) : (
            <>
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
                      <TableHead>
                        <button
                          onClick={() => toggleSortOrder("quoted_price")}
                          className="hover:text-primary transition-colors"
                        >
                          Price
                          {getSortIndicator("quoted_price")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => toggleSortOrder("created_at")}
                          className="hover:text-primary transition-colors"
                        >
                          Created At
                          {getSortIndicator("created_at")}
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #{order.id}
                        </TableCell>
                        <TableCell>{order.phone_name}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{order.partner_name || "-"}</TableCell>
                        <TableCell>{order.agent_name || "-"}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(order.quoted_price)}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(order.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Items per page:
                  </span>
                  <SimpleDropdown
                    value={String(limit)}
                    onChange={(val) => {
                      setLimit(parseInt(val));
                      setPage(1);
                    }}
                    options={[
                      { value: "10", label: "10" },
                      { value: "20", label: "20" },
                      { value: "50", label: "50" },
                      { value: "100", label: "100" },
                    ]}
                    className="w-32"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
