import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Header from "../components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Users,
  TrendingUp,
  Shield,
  MapPin,
  Smartphone,
  IndianRupee,
  CheckCircle,
  Star,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100">
            🚀 Trusted by 1000+ Partners
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Maximize Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              {" "}
              Phone Trading{" "}
            </span>
            Business
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with customers, manage agents, and grow your refurbished
            phone business with our comprehensive partner platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/partner/login")}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Get Started as Partner
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/agent/login")}
              className="flex items-center gap-2"
            >
              Join as Agent
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to run a successful phone trading business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Partner Features */}
            <Card className="border-2 hover:border-purple-200 transition-colors">
              <CardHeader>
                <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>For Partners</CardTitle>
                <CardDescription>
                  Manage your business operations seamlessly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Access live customer leads
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Manage multiple agents
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Real-time order tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Automated payouts
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Agent Features */}
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>For Agents</CardTitle>
                <CardDescription>
                  Execute pickups and earn commissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Scheduled pickup assignments
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Device verification tools
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Instant payment processing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Performance analytics
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Platform Features */}
            <Card className="border-2 hover:border-green-200 transition-colors">
              <CardHeader>
                <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Platform Benefits</CardTitle>
                <CardDescription>
                  Advanced tools for better business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    AI-powered price estimation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Nationwide service coverage
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Secure payment processing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    24/7 customer support
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-3xl font-bold mb-2">10,000+</div>
              <div className="text-purple-100">Phones Processed</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold mb-2">500+</div>
              <div className="text-purple-100">Active Partners</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold mb-2">2,000+</div>
              <div className="text-purple-100">Verified Agents</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold mb-2">4.8★</div>
              <div className="text-purple-100">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Join thousands of partners who trust our platform to manage their
            phone trading operations.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/partner/login")}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Start as Partner
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/agent/login")}
              className="flex items-center gap-2"
            >
              Become an Agent
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">RepriseAI</span>
              </div>
              <p className="text-gray-400">
                Revolutionizing phone trading with AI-powered solutions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Partners</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Lead Management</li>
                <li>Agent Oversight</li>
                <li>Analytics Dashboard</li>
                <li>Payment Processing</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Agents</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Pickup Scheduling</li>
                <li>Device Verification</li>
                <li>Commission Tracking</li>
                <li>Mobile App</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 RepriseAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
