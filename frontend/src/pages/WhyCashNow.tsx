import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckCircle } from "lucide-react";

export default function WhyCashNow() {
    const points = [
        {
            title: "Best Price Guarantee",
            description:
                "We use advanced AI algorithms to analyze market trends and offer you the most competitive price for your device.",
            image: "/assets/client-photos/photo-4.jpeg",
            isLandscape: true,
        },
        {
            title: "Fastest Doorstep Pickup",
            description:
                "Our extensive network of agents ensures that your device is picked up within 24-48 hours of scheduling.",
            image: "/assets/client-photos/photo-2.jpeg",
        },
        {
            title: "Instant Payment",
            description:
                "Get paid instantly via bank transfer or UPI as soon as our agent verifies your device at your doorstep.",
            image: "/assets/client-photos/photo-9.jpeg",
            isLandscape: true,
        },
        {
            title: "Safe & Secure",
            description:
                "Your data privacy is our priority. We ensure complete data wiping and secure handling of your device.",
            image: "/assets/client-photos/photo-6.jpeg",
        },
        {
            title: "Hassle-Free Process",
            description:
                "Skip the classifieds and negotiations. Sell your phone in just a few clicks from the comfort of your home.",
            image: "/assets/client-photos/photo-5.jpeg",
            isLandscape: true,
        },
        {
            title: "Sustainability First",
            description:
                "By selling your old device, you're contributing to a circular economy and reducing e-waste.",
            image: "/assets/client-photos/photo-7.jpeg",
        },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow bg-gray-50">
                <section className="bg-primary text-primary-foreground py-16">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl font-bold mb-4">Why Choose CashNow?</h1>
                        <p className="text-xl opacity-90 max-w-2xl mx-auto">
                            The trusted choice for over 1 lakh happy customers across India
                        </p>
                    </div>
                </section>

                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="space-y-20 lg:space-y-32">
                            {points.map((point, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center"
                                >
                                    {/* Image Section */}
                                    <div
                                        className={`relative group overflow-hidden rounded-2xl shadow-xl mx-auto ${
                                            // @ts-ignore
                                            point.isLandscape ? "max-w-2xl" : "max-w-xs"
                                            } ${index % 2 === 1 ? "md:order-2" : ""}`}
                                    >
                                        <img
                                            src={point.image}
                                            alt={point.title}
                                            className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                                    </div>

                                    {/* Text Section */}
                                    <div
                                        className={`flex flex-col justify-center ${index % 2 === 1 ? "md:order-1" : ""
                                            }`}
                                    >
                                        <h3 className="text-3xl font-bold mb-4 flex items-center gap-3">
                                            <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                                                <CheckCircle className="text-primary w-6 h-6" />
                                            </div>
                                            {point.title}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed text-lg lg:text-xl">
                                            {point.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
