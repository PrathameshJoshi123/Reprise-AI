import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
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
  Smartphone,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <Header
        showLoginButtons={!user}
        showLogout={!!user}
        onLogout={handleLogout}
        userName={user?.name}
      />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <motion.div
          className="container mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100">
              🚀 Trusted by 1000+ Partners
            </Badge>
          </motion.div>
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            variants={fadeInUp}
          >
            Maximize Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              {" "}
              Phone Trading{" "}
            </span>
            Business
          </motion.h1>
          <motion.p
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            variants={fadeInUp}
          >
            Connect with customers, manage agents, and grow your refurbished
            phone business with our comprehensive partner platform.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={fadeInUp}
          >
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
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to run a successful phone trading business
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {/* Partner Features */}
            <motion.div
              variants={scaleIn}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -8 }}
            >
              <Card className="bg-purple-50 border-none h-full shadow-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="bg-white p-4 rounded-xl w-fit mb-4 shadow-sm">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-2xl">For Partners</CardTitle>
                  <CardDescription className="text-base">
                    Manage your business operations seamlessly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        Access live customer leads
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        Manage multiple agents
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        Real-time order tracking
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Automated payouts</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Agent Features */}
            <motion.div
              variants={scaleIn}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -8 }}
            >
              <Card className="bg-blue-50 border-none h-full shadow-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="bg-white p-4 rounded-xl w-fit mb-4 shadow-sm">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl">For Agents</CardTitle>
                  <CardDescription className="text-base">
                    Execute pickups and earn commissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        Scheduled pickup assignments
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        Device verification tools
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        Instant payment processing
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        Performance analytics
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Platform Features */}
            <motion.div
              variants={scaleIn}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -8 }}
            >
              <Card className="bg-green-50 border-none h-full shadow-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="bg-white p-4 rounded-xl w-fit mb-4 shadow-sm">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl">Platform Benefits</CardTitle>
                  <CardDescription className="text-base">
                    Advanced tools for better business
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        AI-powered price estimation
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        Nationwide service coverage
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        Secure payment processing
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        24/7 customer support
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600">
        <motion.div
          className="container mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <motion.div className="text-white" variants={fadeInUp}>
              <div className="text-3xl font-bold mb-2">10,000+</div>
              <div className="text-purple-100">Phones Processed</div>
            </motion.div>
            <motion.div className="text-white" variants={fadeInUp}>
              <div className="text-3xl font-bold mb-2">500+</div>
              <div className="text-purple-100">Active Partners</div>
            </motion.div>
            <motion.div className="text-white" variants={fadeInUp}>
              <div className="text-3xl font-bold mb-2">2,000+</div>
              <div className="text-purple-100">Verified Agents</div>
            </motion.div>
            <motion.div className="text-white" variants={fadeInUp}>
              <div className="text-3xl font-bold mb-2">4.8★</div>
              <div className="text-purple-100">Customer Rating</div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div
          className="container mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2
            className="text-3xl font-bold text-gray-900 mb-4"
            variants={fadeInUp}
          >
            Ready to Grow Your Business?
          </motion.h2>
          <motion.p
            className="text-gray-600 mb-8 max-w-xl mx-auto"
            variants={fadeInUp}
          >
            Join thousands of partners who trust our platform to manage their
            phone trading operations.
          </motion.p>
          <motion.div className="flex gap-4 justify-center" variants={fadeInUp}>
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
          </motion.div>
        </motion.div>
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
