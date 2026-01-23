import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import Header from "../components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export default function PartnerLogin() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
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

  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
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
          formData.gst_number || undefined,
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {isLogin ? "Partner Login" : "Partner Application"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin
                ? "Login to manage your leads and agents"
                : "Apply to become a verified partner. Your application will be reviewed by our team."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            full_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company/Business Name *</Label>
                    <Input
                      id="company"
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address *</Label>
                    <Textarea
                      id="address"
                      required
                      rows={2}
                      placeholder="Complete business address"
                      value={formData.business_address}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          business_address: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pan">PAN Number *</Label>
                      <Input
                        id="pan"
                        type="text"
                        required
                        maxLength={10}
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
                    <div className="space-y-2">
                      <Label htmlFor="gst">GST Number (Optional)</Label>
                      <Input
                        id="gst"
                        type="text"
                        maxLength={15}
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

                  <div className="space-y-2">
                    <Label htmlFor="pincodes">Serviceable Pincodes *</Label>
                    <Input
                      id="pincodes"
                      type="text"
                      required
                      placeholder="Enter pincodes separated by commas (e.g., 110001, 110002, 110003)"
                      value={formData.serviceable_pincodes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serviceable_pincodes: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      Enter all pincodes where you can provide pickup services
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              {!isLogin && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Your application will be reviewed by
                    our team. You'll receive an email notification once your
                    account is approved.
                  </p>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-500 text-center bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Login"
                    : "Submit Application"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                >
                  {isLogin
                    ? "Don't have an account? Apply now"
                    : "Already have an account? Login"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
