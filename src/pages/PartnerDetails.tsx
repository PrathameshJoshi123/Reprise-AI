import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import api from "../lib/api";
import { formatDateTime } from "../lib/utils";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Ban, PlayCircle } from "lucide-react";
import { toast } from "sonner";

interface PartnerDetails {
  partner: {
    id: number;
    email: string;
    full_name: string;
    phone: string;
    company_name: string;
    business_address: string;
    gst_number: string;
    pan_number: string;
    verification_status: string;
    rejection_reason: string;
    credit_balance: number;
    is_active: boolean;
    created_at: string;
    account_status_reason: string;
  };
  serviceable_pincodes: Array<{
    id: number;
    pincode: string;
    city: string;
    state: string;
    is_active: boolean;
  }>;
  verification_history: Array<{
    id: number;
    action_type: string;
    message_from_admin: string;
    message_from_partner: string;
    created_at: string;
  }>;
}

export default function PartnerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState<PartnerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [clarifyDialog, setClarifyDialog] = useState(false);
  const [holdDialog, setHoldDialog] = useState(false);
  const [activateDialog, setActivateDialog] = useState(false);

  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [clarificationMessage, setClarificationMessage] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [activateReason, setActivateReason] = useState("");

  useEffect(() => {
    fetchPartnerDetails();
  }, [id]);

  const fetchPartnerDetails = async () => {
    try {
      const response = await api.get(
        `/admin/partners/${id}/verification-details`,
      );
      setDetails(response.data);
    } catch (error) {
      console.error("Failed to fetch partner details:", error);
      toast.error("Failed to load partner details");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.post(`/admin/partners/${id}/approve`, {
        approval_notes: approvalNotes,
      });
      toast.success("Partner approved successfully");
      setApproveDialog(false);
      await fetchPartnerDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to approve partner");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/admin/partners/${id}/reject`, {
        rejection_reason: rejectionReason,
      });
      toast.success("Partner rejected");
      setRejectDialog(false);
      await fetchPartnerDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to reject partner");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestClarification = async () => {
    if (!clarificationMessage.trim()) {
      toast.error("Please provide a message");
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/admin/partners/${id}/request-clarification`, {
        message: clarificationMessage,
      });
      toast.success("Clarification requested");
      setClarifyDialog(false);
      setClarificationMessage("");
      await fetchPartnerDetails();
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to request clarification",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleHold = async () => {
    if (!holdReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/admin/partners/${id}/hold`, {
        reason: holdReason,
      });
      toast.success("Partner account put on hold");
      setHoldDialog(false);
      setHoldReason("");
      await fetchPartnerDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to hold partner account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      await api.post(`/admin/partners/${id}/activate`, {
        reason: activateReason,
      });
      toast.success("Partner account activated");
      setActivateDialog(false);
      setActivateReason("");
      await fetchPartnerDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to activate partner account");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Partner not found</p>
        <Button onClick={() => navigate("/partners")} className="mt-4">
          Back to Partners
        </Button>
      </div>
    );
  }

  const { partner, serviceable_pincodes, verification_history } = details;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Partner Details</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage partner verification
          </p>
        </div>
      </div>

      {/* Partner Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{partner.full_name}</CardTitle>
              <CardDescription>{partner.email}</CardDescription>
            </div>
            <Badge
              variant={
                partner.verification_status === "approved"
                  ? "default"
                  : partner.verification_status === "rejected"
                    ? "destructive"
                    : "secondary"
              }
            >
              {partner.verification_status.replace(/_/g, " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p className="font-medium">{partner.phone}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Company Name</Label>
              <p className="font-medium">{partner.company_name || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Business Address</Label>
              <p className="font-medium">{partner.business_address || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">GST Number</Label>
              <p className="font-medium">{partner.gst_number || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">PAN Number</Label>
              <p className="font-medium">{partner.pan_number || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Credit Balance</Label>
              <p className="font-medium">₹{partner.credit_balance}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Applied On</Label>
              <p className="font-medium">
                {formatDateTime(partner.created_at)}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Account Status</Label>
              <p className="font-medium">
                {partner.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          {partner.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <Label className="text-red-800 font-semibold">
                Rejection Reason
              </Label>
              <p className="text-red-700 mt-1">{partner.rejection_reason}</p>
            </div>
          )}

          {partner.account_status_reason && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <Label className="text-yellow-800 font-semibold">
                Account Status Reason
              </Label>
              <p className="text-yellow-700 mt-1">{partner.account_status_reason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Serviceable Pincodes */}
      <Card>
        <CardHeader>
          <CardTitle>Serviceable Pincodes</CardTitle>
          <CardDescription>
            {serviceable_pincodes.length} pincode(s) configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {serviceable_pincodes.length === 0 ? (
              <p className="text-muted-foreground">No pincodes configured</p>
            ) : (
              serviceable_pincodes.map((pincode) => (
                <Badge key={pincode.id} variant="outline">
                  {pincode.pincode}
                  {pincode.city && ` - ${pincode.city}`}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification History */}
      <Card>
        <CardHeader>
          <CardTitle>Verification History</CardTitle>
          <CardDescription>
            Timeline of all verification actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verification_history.length === 0 ? (
            <p className="text-muted-foreground">No history available</p>
          ) : (
            <div className="space-y-4">
              {verification_history.map((entry) => (
                <div
                  key={entry.id}
                  className="border-l-2 border-border pl-4 pb-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">
                      {entry.action_type.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(entry.created_at)}
                    </span>
                  </div>
                  {entry.message_from_admin && (
                    <div className="bg-blue-50 rounded p-3 mt-2">
                      <p className="text-sm font-semibold text-blue-800">
                        Admin Message:
                      </p>
                      <p className="text-sm text-blue-700">
                        {entry.message_from_admin}
                      </p>
                    </div>
                  )}
                  {entry.message_from_partner && (
                    <div className="bg-muted rounded p-3 mt-2">
                      <p className="text-sm font-semibold text-foreground">
                        Partner Response:
                      </p>
                      <p className="text-sm text-foreground">
                        {entry.message_from_partner}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Review and take action on this application
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {partner.verification_status !== "approved" && partner.verification_status !== "rejected" && (
            <>
              <Button
                onClick={() => setApproveDialog(true)}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Partner
              </Button>
              <Button
                onClick={() => setClarifyDialog(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Request Clarification
              </Button>
              <Button
                onClick={() => setRejectDialog(true)}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject Application
              </Button>
            </>
          )}

          {partner.verification_status === "approved" && (
            <>
              {partner.is_active ? (
                <Button
                  onClick={() => setHoldDialog(true)}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Ban className="h-4 w-4" />
                  Hold Account
                </Button>
              ) : (
                <Button
                  onClick={() => setActivateDialog(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <PlayCircle className="h-4 w-4" />
                  Activate Account
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialog} onOpenChange={setApproveDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Partner</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve the partner and grant them access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Approval Notes (Optional)</Label>
            <Textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add any notes for this approval..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejection. This will be visible to the
              partner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Rejection Reason *</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this application is being rejected..."
              rows={4}
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Rejecting..." : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clarification Dialog */}
      <AlertDialog open={clarifyDialog} onOpenChange={setClarifyDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Request Clarification</AlertDialogTitle>
            <AlertDialogDescription>
              Request additional information or documents from the partner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Message to Partner *</Label>
            <Textarea
              value={clarificationMessage}
              onChange={(e) => setClarificationMessage(e.target.value)}
              placeholder="What additional information do you need?"
              rows={4}
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestClarification}
              disabled={actionLoading}
            >
              {actionLoading ? "Sending..." : "Send Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hold Dialog */}
      <AlertDialog open={holdDialog} onOpenChange={setHoldDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Hold Partner Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will suspend the partner's access to the system. Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>hold Reason *</Label>
            <Textarea
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              placeholder="Explain why this account is being put on hold..."
              rows={4}
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHold}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Processing..." : "Hold Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Dialog */}
      <AlertDialog open={activateDialog} onOpenChange={setActivateDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Partner Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the partner's access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Activation Note (Optional)</Label>
            <Textarea
              value={activateReason}
              onChange={(e) => setActivateReason(e.target.value)}
              placeholder="Add any notes for this activation..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivate}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? "Processing..." : "Activate Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
