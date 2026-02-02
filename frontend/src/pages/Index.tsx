import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  DollarSign,
  PhoneIcon,
  Shield,
  Smartphone,
  Truck,
  Wallet,
  Zap,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { motion } from "motion/react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
  hover: {
    scale: 1.05,
    y: -10,
    transition: {
      duration: 0.3,
    },
  },
};

export default function Index() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-background pt-20 pb-32 overflow-hidden">
        {/* Subtle animated accent */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full filter blur-xl opacity-60"
          animate={{
            scale: [1, 1.05, 1],
            x: [0, 20, 0],
            y: [0, 10, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-6xl mx-auto mb-16"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Left: Quote & CTAs */}
            <motion.div
              className="space-y-6 text-left px-4 md:px-0"
              variants={itemVariants}
            >
              <motion.div
                className="inline-block mb-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
                whileHover={{ scale: 1.03 }}
              >
                🚀 India's Leading Mobile Trade Platform
              </motion.div>

              <motion.h1
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-primary leading-tight"
                variants={itemVariants}
              >
                "Turn Your Old Phone Into Instant Cash"
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-lg text-gray-700"
              >
                We make selling devices simple, secure and fast — instant
                quotes, doorstep pickup, and guaranteed payments. Trusted by
                thousands of customers and a growing agent network.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                variants={itemVariants}
              >
                <Link to="/sell-phone">
                  <Button className="bg-primary text-primary-foreground hover:brightness-95">
                    Sell Now
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: Provided image */}
            <motion.div
              className="flex items-center justify-center"
              variants={itemVariants}
            >
              <motion.img
                src="/assets/client-photos/photo-1.jpeg"
                alt="Agent and customer interaction"
                className="w-full h-auto max-w-xl rounded-2xl shadow-2xl"
                initial={{ opacity: 0, scale: 0.98, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                whileHover={{ scale: 1.02 }}
              />
            </motion.div>
          </motion.div>

          {/* Dual CTA Cards */}
          {/* Single CTA Card Centered */}
          <motion.div
            className="flex justify-center max-w-5xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Customer Card */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="w-full max-w-md"
            >
              <Card className="border-2 border-secondary h-full relative overflow-hidden group">
                <CardContent className="p-8 relative z-10">
                  <motion.div
                    className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Smartphone className="text-primary-foreground" size={32} />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-4 text-center">
                    I'm a Customer
                  </h2>
                  <p className="text-gray-600 mb-6 leading-relaxed text-center">
                    Sell your old phone instantly. Get the best price, free
                    doorstep pickup, and instant payment.
                  </p>
                  <motion.ul className="space-y-3 mb-8">
                    {[
                      "Instant price quotes",
                      "Free doorstep pickup",
                      "Safe & secure payment",
                      "Data wiped securely",
                    ].map((item, index) => (
                      <motion.li
                        key={index}
                        className="flex items-center text-sm"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                      >
                        <CheckCircle
                          className="text-green-500 mr-2 flex-shrink-0"
                          size={18}
                        />
                        {item}
                      </motion.li>
                    ))}
                  </motion.ul>
                  <Link to="/sell-phone">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button className="w-full bg-primary text-primary-foreground hover:brightness-95">
                        Sell Your Phone Now
                        <motion.span
                          className="inline-block ml-2"
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight size={18} />
                        </motion.span>
                      </Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}


      {/* Stats Section */}
      <motion.section
        className="py-20 bg-primary text-primary-foreground relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated background shapes */}
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { number: "50K+", label: "Happy Customers" },
              { number: "2K+", label: "Service Centers" },
              { number: "₹10Cr+", label: "Transactions" },
              { number: "4.8★", label: "Customer Rating" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.1, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="text-4xl md:text-5xl font-bold mb-2"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100,
                  }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-primary-foreground/80">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>



      {/* CTA Section */}
      <motion.section
        className="py-20 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-gray-600 mb-10">
              Join thousands of satisfied customers and agents on India's most
              trusted mobile trading platform
            </p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/sell-phone">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:brightness-95 w-full sm:w-auto"
                  >
                    <Smartphone className="mr-2" size={20} />
                    Sell My Phone
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
