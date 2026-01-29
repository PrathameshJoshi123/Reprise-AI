import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import api from "../lib/api";
import { toast } from "sonner";
import { showErrorToastWithRetry, showSuccessToast } from "../lib/errorHandler";
import { formatDateTime, formatCurrency } from "../lib/utils";
import { Button } from "../components/ui/button";
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
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Settings } from "lucide-react";

interface CreditPlan {
  id: number;
  plan_name: string;
  credit_amount: number;
  price: number;
  bonus_percentage: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface SystemConfig {
  id: number;
  config_key: string;
  config_value: string;
  description: string | null;
  updated_at: string;
}

export default function CreditPlans() {
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [configDialog, setConfigDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CreditPlan | null>(null);
  const [leadCostPercentage, setLeadCostPercentage] = useState<string>("15.0");
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  const [formData, setFormData] = useState({
    plan_name: "",
    credit_amount: "",
    price: "",
    bonus_percentage: "",
    description: "",
  });

  useEffect(() => {
    fetchPlans();
    fetchSystemConfig();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/credit-plans");
      setPlans(response.data);
    } catch (error: any) {
      console.error("Failed to fetch credit plans:", error);
      const retryFn = () => fetchPlans();
      showErrorToastWithRetry(error, retryFn, "Credit plans");
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const response = await api.get("/admin/config");
      const configs: SystemConfig[] = response.data;
      const leadCostConfig = configs.find(
        (c) => c.config_key === "lead_cost_percentage",
      );
      if (leadCostConfig) {
        setLeadCostPercentage(leadCostConfig.config_value);
      }
    } catch (error: any) {
      console.error("Failed to fetch system config:", error);
      toast.error("Could not load system config.", { duration: 3000 });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/credit-plans", {
        ...formData,
        credit_amount: parseFloat(formData.credit_amount),
        price: parseFloat(formData.price),
        bonus_percentage: parseFloat(formData.bonus_percentage) || 0,
      });
      showSuccessToast("Credit plan created successfully!");
      setCreateDialog(false);
      resetForm();
      await fetchPlans();
    } catch (error: any) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.detail?.includes("already exists")
      ) {
        toast.error("A plan with this name already exists.", {
          duration: 4000,
        });
      } else {
        showErrorToastWithRetry(
          error,
          () => handleCreate(e),
          "Create credit plan",
        );
      }
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    try {
      await api.put(`/admin/credit-plans/${selectedPlan.id}`, {
        ...formData,
        credit_amount: parseFloat(formData.credit_amount),
        price: parseFloat(formData.price),
        bonus_percentage: parseFloat(formData.bonus_percentage) || 0,
      });
      showSuccessToast("Credit plan updated successfully!");
      setEditDialog(false);
      resetForm();
      setSelectedPlan(null);
      await fetchPlans();
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("Credit plan not found.", { duration: 4000 });
      } else {
        showErrorToastWithRetry(
          error,
          () => handleEdit(e),
          "Update credit plan",
        );
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this credit plan?"))
      return;

    try {
      await api.delete(`/admin/credit-plans/${id}`);
      showSuccessToast("Credit plan deactivated successfully!");
      await fetchPlans();
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("Credit plan not found.", { duration: 4000 });
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.detail?.includes("in use")
      ) {
        toast.error("Cannot deactivate a plan that has active subscriptions.", {
          duration: 4000,
        });
      } else {
        showErrorToastWithRetry(
          error,
          () => handleDelete(id),
          "Delete credit plan",
        );
      }
    }
  };

  const openEditDialog = (plan: CreditPlan) => {
    setSelectedPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      credit_amount: plan.credit_amount.toString(),
      price: plan.price.toString(),
      bonus_percentage: plan.bonus_percentage.toString(),
      description: plan.description || "",
    });
    setEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      plan_name: "",
      credit_amount: "",
      price: "",
      bonus_percentage: "",
      description: "",
    });
  };

  const handleUpdateLeadCostPercentage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingConfig(true);
    try {
      const value = parseFloat(leadCostPercentage);
      if (isNaN(value) || value < 0 || value > 100) {
        toast.error("Please enter a valid percentage between 0 and 100.", {
          duration: 4000,
        });
        setIsUpdatingConfig(false);
        return;
      }
      await api.put("/admin/config/lead_cost_percentage", {
        config_value: leadCostPercentage,
      });
      showSuccessToast("Lead cost percentage updated successfully!");
      setConfigDialog(false);
    } catch (error: any) {
      showErrorToastWithRetry(
        error,
        () => handleUpdateLeadCostPercentage(e),
        "Update lead cost percentage",
      );
    } finally {
      setIsUpdatingConfig(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credit Plans</h1>
          <p className="text-muted-foreground mt-1">
            Manage credit packages for partners
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConfigDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configure Lead Cost
          </Button>
          <Button onClick={() => setCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Credit Plans</CardTitle>
          <CardDescription>{plans.length} plan(s) configured</CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No credit plans found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Credit Amount</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Bonus %</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      {plan.plan_name}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(plan.credit_amount)}
                    </TableCell>
                    <TableCell>{formatCurrency(plan.price)}</TableCell>
                    <TableCell>{plan.bonus_percentage}%</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {plan.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Credit Plan</DialogTitle>
            <DialogDescription>
              Create a new credit package for partners to purchase
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan_name">Plan Name *</Label>
              <Input
                id="plan_name"
                required
                value={formData.plan_name}
                onChange={(e) =>
                  setFormData({ ...formData, plan_name: e.target.value })
                }
                placeholder="e.g., Starter Pack"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credit_amount">Credit Amount *</Label>
                <Input
                  id="credit_amount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.credit_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, credit_amount: e.target.value })
                  }
                  placeholder="10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="9000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus_percentage">Bonus Percentage</Label>
              <Input
                id="bonus_percentage"
                type="number"
                step="0.01"
                value={formData.bonus_percentage}
                onChange={(e) =>
                  setFormData({ ...formData, bonus_percentage: e.target.value })
                }
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe this plan..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Plan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Credit Plan</DialogTitle>
            <DialogDescription>
              Update the credit plan details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_plan_name">Plan Name *</Label>
              <Input
                id="edit_plan_name"
                required
                value={formData.plan_name}
                onChange={(e) =>
                  setFormData({ ...formData, plan_name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_credit_amount">Credit Amount *</Label>
                <Input
                  id="edit_credit_amount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.credit_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, credit_amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_price">Price (₹) *</Label>
                <Input
                  id="edit_price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_bonus_percentage">Bonus Percentage</Label>
              <Input
                id="edit_bonus_percentage"
                type="number"
                step="0.01"
                value={formData.bonus_percentage}
                onChange={(e) =>
                  setFormData({ ...formData, bonus_percentage: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialog(false);
                  resetForm();
                  setSelectedPlan(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Update Plan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Lead Cost Percentage</DialogTitle>
            <DialogDescription>
              Set the percentage of quoted price that partners pay to purchase a
              lead
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateLeadCostPercentage} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lead_cost_percentage">
                Lead Cost Percentage (%)
              </Label>
              <Input
                id="lead_cost_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={leadCostPercentage}
                onChange={(e) => setLeadCostPercentage(e.target.value)}
                placeholder="15.0"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Example: If a phone's quoted price is ₹10,000 and this is set to
                15%, the lead cost will be ₹1,500.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfigDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingConfig}>
                {isUpdatingConfig ? "Updating..." : "Update Configuration"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
