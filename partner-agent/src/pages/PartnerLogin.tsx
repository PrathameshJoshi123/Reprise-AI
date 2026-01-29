import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import Header from "../components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  UserCircle,
  Lock,
  Phone,
  Building2,
  MapPin,
  CreditCard,
  FileText,
  AlertCircle,
  LogIn,
  UserPlus,
  Mail,
  Briefcase,
} from "lucide-react";
import PartnerOnHoldModal from "../components/PartnerOnHoldModal";

export default function PartnerLogin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    company_name: "",
    business_address: "",
    gst_number: "",
    pan_number: "",
    serviceable_pincodes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup, holdInfo, clearHoldInfo } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (activeTab === "login") {
        await login(formData.email, formData.password, "partner");
      } else {
        // Parse comma-separated pincodes
        const pincodes = formData.serviceable_pincodes
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p.length > 0);

        if (pincodes.length === 0) {
          setError("Please enter at least one serviceable pincode");
          setLoading(false);
          return;
        }

        // Validate PAN format (10 characters)
        if (formData.pan_number.length !== 10) {
          setError("PAN number must be 10 characters");
          setLoading(false);
          return;
        }

        // Validate GST format if provided (15 characters)
        if (formData.gst_number && formData.gst_number.length !== 15) {
          setError("GST number must be 15 characters");
          setLoading(false);
          return;
        }

        await signup(
          formData.full_name,
          formData.email,
          formData.password,
          formData.phone,
          formData.company_name,
          formData.business_address,
          formData.gst_number,
          formData.pan_number,
          pincodes,
        );
        navigate("/partner/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header showLoginButtons={false} />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-2xl shadow-2xl border-0 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -translate-y-20 translate-x-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full translate-y-16 -translate-x-16" />

          <CardHeader className="space-y-3 relative">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl text-center font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Partner Portal
            </CardTitle>
            <CardDescription className="text-center text-base">
              Login or apply to become a verified partner
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Apply Now
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email-login"
                      className="text-sm font-medium"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="email-login"
                        type="email"
                        required
                        className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="partner@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password-login"
                      className="text-sm font-medium"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="password-login"
                        type="password"
                        required
                        minLength={8}
                        className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert
                      variant="destructive"
                      className="animate-in slide-in-from-top-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Login to Dashboard
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Your application will be reviewed by our team. You'll
                      receive an email once approved.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="full_name"
                        className="text-sm font-medium"
                      >
                        Full Name *
                      </Label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="full_name"
                          type="text"
                          required
                          className="pl-10 h-11"
                          placeholder="John Doe"
                          value={formData.full_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              full_name: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          required
                          className="pl-10 h-11"
                          placeholder="10-digit mobile number"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email-signup"
                      className="text-sm font-medium"
                    >
                      Email Address *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="email-signup"
                        type="email"
                        required
                        className="pl-10 h-11"
                        placeholder="partner@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password-signup"
                      className="text-sm font-medium"
                    >
                      Password *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="password-signup"
                        type="password"
                        required
                        minLength={8}
                        className="pl-10 h-11"
                        placeholder="Minimum 8 characters"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium">
                      Shop Name *
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="company"
                        type="text"
                        required
                        className="pl-10 h-11"
                        placeholder="Your Shop Name"
                        value={formData.company_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            company_name: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">
                      Shop Address *
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <Textarea
                        id="address"
                        required
                        rows={2}
                        className="pl-10 resize-none"
                        placeholder="Complete shop address"
                        value={formData.business_address}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            business_address: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pan" className="text-sm font-medium">
                        PAN Number *
                      </Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="pan"
                          type="text"
                          required
                          maxLength={10}
                          className="pl-10 h-11 uppercase"
                          placeholder="ABCDE1234F"
                          value={formData.pan_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pan_number: e.target.value.toUpperCase(),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gst" className="text-sm font-medium">
                        GST Number (Optional)
                      </Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="gst"
                          type="text"
                          maxLength={15}
                          className="pl-10 h-11 uppercase"
                          placeholder="15-digit GST number"
                          value={formData.gst_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gst_number: e.target.value.toUpperCase(),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pincodes" className="text-sm font-medium">
                      Serviceable Pincodes *
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="pincodes"
                        type="text"
                        required
                        className="pl-10 h-11"
                        placeholder="e.g., 110001, 110002, 110003"
                        value={formData.serviceable_pincodes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            serviceable_pincodes: e.target.value,
                          })
                        }
                      />
                    </div>
                    <p className="text-xs text-gray-500 pl-10">
                      Enter all pincodes where you can provide pickup services
                      (comma-separated)
                    </p>
                  </div>

                  {error && (
                    <Alert
                      variant="destructive"
                      className="animate-in slide-in-from-top-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Partner On Hold Modal */}
      <PartnerOnHoldModal
        isOpen={!!holdInfo}
        reason={holdInfo?.reason}
        liftDate={holdInfo?.liftDate}
      />
    </>
  );
}
