import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
// Tabs removed per request — showing phone grid directly
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Search, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { useQuery } from "@tanstack/react-query";

const BRANDS = [
  {
    id: 1,
    name: "Samsung",
    logo: "/assets/brands/samsung.png",
    popularModels: ["Galaxy S21", "Galaxy Note 20", "Galaxy A52"],
  },
  {
    id: 2,
    name: "Apple",
    logo: "/assets/brands/apple.png",
    popularModels: ["iPhone 12", "iPhone 11", "iPhone SE"],
  },
  {
    id: 3,
    name: "OnePlus",
    logo: "/assets/brands/oneplus.png",
    popularModels: ["OnePlus 9", "OnePlus 8T", "OnePlus Nord"],
  },
  {
    id: 4,
    name: "Xiaomi",
    logo: "/assets/brands/xiaomi.png",
    popularModels: ["Mi 11", "Redmi Note 10", "Poco X3"],
  },
  {
    id: 5,
    name: "Oppo",
    logo: "/assets/brands/oppo.png",
    popularModels: ["Oppo Find X3", "Oppo Reno 5", "Oppo A54"],
  },
  {
    id: 6,
    name: "Vivo",
    logo: "/assets/brands/vivo.png",
    popularModels: ["Vivo X60", "Vivo V21", "Vivo Y20"],
  },
];

const SLIDER_IMAGES = [
  "/images/slider1.jpg",
  "/images/slider2.jpg",
  "/images/slider3.jpg",
  "/images/slider4.jpg",
];

export default function SellPhone() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10; // Items per page

  // Fetch phones from backend
  const { data, isLoading, error } = useQuery({
    queryKey: ["phones", page, limit, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (searchQuery) params.append("search", searchQuery);
      const API_URL = (
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
      ).replace(/\/$/, "");
      const response = await fetch(
        `${API_URL}/sell-phone/phones?${params.toString()}`,
      );
      if (!response.ok) throw new Error("Failed to fetch phones");
      return response.json();
    },
  });

  const phones = data?.phones || [];
  const totalPages = data?.total_pages || 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is now handled by the query refetch
  };

  // Remove local filtering since backend handles it
  const filteredPhones = phones;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Carousel Section */}
        <section className="bg-background">
          <div className="container mx-auto px-4 py-8">
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[Autoplay({ delay: 4000 })]}
              className="w-full"
            >
              <CarouselContent>
                {SLIDER_IMAGES.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative h-[260px] md:h-[380px] rounded-2xl overflow-hidden">
                      <img
                        src={image}
                        alt={`Slide ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            `https://placehold.co/1200x400/3b82f6/ffffff?text=Slide+${
                              index + 1
                            }`;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                      <div className="absolute bottom-6 left-6 text-white">
                        <h2 className="text-lg md:text-3xl font-bold">
                          Sell Your Old Phone Today
                        </h2>
                        <p className="text-sm md:text-lg opacity-90">
                          Get instant quotes and best prices
                        </p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>
        </section>

        {/* Search and Tabs Section */}
        <section className="py-8 bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for your phone model or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Button
                  type="submit"
                  className="absolute right-1 top-1 h-8"
                  size="sm"
                >
                  Search
                </Button>
              </div>
            </form>

            {isLoading && <p>Loading phones...</p>}
            {error && <p>Error loading phones: {error.message}</p>}
            {!isLoading && !error && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {filteredPhones.map((phone) => (
                    <div key={phone.id} className="group">
                      <Card className="overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 rounded-3xl bg-gradient-to-br from-pink-50 via-blue-50 to-yellow-50 h-[320px]">
                        <CardContent className="p-4 flex flex-col relative h-full">
                          <Link
                            to={`/sell/${phone.id}`}
                            className="flex flex-col h-full"
                          >
                            {/* Product Image */}
                            <div className="w-full h-44 md:h-56 mb-3 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl p-0 group-hover:bg-white/80 transition-all overflow-hidden">
                              <img
                                src={
                                  phone.image ||
                                  `/assets/phones/${phone.id}.png`
                                }
                                alt={phone.Brand + " " + phone.Model}
                                className="w-full h-full object-cover drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  if (img.dataset.attempt === "1") {
                                    img.src = `https://placehold.co/400x300/e0e7ff/6366f1?text=${encodeURIComponent(
                                      phone.Brand + " " + phone.Model,
                                    )}`;
                                    return;
                                  }
                                  img.dataset.attempt = "1";
                                  img.src = `/assets/phones/${phone.id}.png`;
                                }}
                              />
                            </div>

                            {/* Product Info */}
                            <div className="flex-grow flex flex-col justify-start">
                              <h3 className="font-bold text-sm mb-1 line-clamp-2 text-gray-900">
                                {phone.Brand + " " + phone.Model}
                              </h3>
                              <p className="text-xs text-gray-500 mb-2">
                                {phone.Brand}
                              </p>
                              <div className="pt-2 flex flex-col">
                                <p className="text-sm font-bold text-green-600 mb-2">
                                  ₹
                                  {phone.Selling_Price?.toLocaleString(
                                    "en-IN",
                                  ) || "N/A"}
                                </p>
                                <div className="flex items-center justify-between gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-4 py-1 text-xs font-medium"
                                  >
                                    Sell
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-center items-center mt-8 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Why Sell With Us Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-10">
              Why Sell With MobileTrade?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Fast & Efficient</h3>
                <p className="text-gray-600">
                  Get a quote in minutes, not days. Our pickup process is quick
                  and hassle-free.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 text-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Trusted Service</h3>
                <p className="text-gray-600">
                  Over 1 million satisfied customers have trusted us with their
                  phones.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 text-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="M7 15h0"></path>
                    <path d="M12 15h0"></path>
                    <path d="M17 15h0"></path>
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Instant Payment</h3>
                <p className="text-gray-600">
                  Receive payment immediately upon phone verification, directly
                  to your preferred method.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
