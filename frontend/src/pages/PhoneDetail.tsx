import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Box,
  HardDrive,
  Smartphone,
  DollarSign,
  Home,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/context/AuthContext";

const STEPS = [
  { id: 1, name: "RAM", icon: HardDrive },
  { id: 2, name: "Storage", icon: HardDrive },
  { id: 3, name: "Condition", icon: Smartphone },
  { id: 4, name: "Final Quote", icon: DollarSign },
];

export default function PhoneDetail() {
  const { phoneId } = useParams<{ phoneId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [selectedRam, setSelectedRam] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");
  const [selectedScreenCondition, setSelectedScreenCondition] = useState("");
  const [deviceTurnsOn, setDeviceTurnsOn] = useState<string>("");
  const [hasOriginalBox, setHasOriginalBox] = useState<string>("");
  const [hasOriginalBill, setHasOriginalBill] = useState<string>("");
  const [customRamInput, setCustomRamInput] = useState(""); // New state for custom RAM input

  // Fetch phone data from backend
  const {
    data: phoneData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["phone", phoneId],
    queryFn: async () => {
      const API_URL = (
        import.meta.env.VITE_API_URL || "http://localhost:8000"
      ).replace(/\/$/, "");
      const response = await fetch(`${API_URL}/sell-phone/phones/${phoneId}`);
      if (!response.ok) throw new Error("Failed to fetch phone");
      return response.json();
    },
    enabled: !!phoneId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Fetch phone variants
  const { data: variants } = useQuery({
    queryKey: ["phoneVariants", phoneId],
    queryFn: async () => {
      const API_URL = (
        import.meta.env.VITE_API_URL || "http://localhost:8000"
      ).replace(/\/$/, "");
      const response = await fetch(
        `${API_URL}/sell-phone/phones/${phoneId}/variants`,
      );
      if (!response.ok) throw new Error("Failed to fetch variants");
      return response.json();
    },
    enabled: !!phoneId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Fetch dynamic base price based on selections
  const { data: variantPrice } = useQuery({
    queryKey: ["phoneVariantPrice", phoneId, selectedRam, selectedStorage],
    queryFn: async () => {
      // Updated to parse selectedRam dynamically (e.g., "8gb" -> 8)
      const parseRam = (ram: string) => {
        const match = ram.match(/^(\d+)gb$/i);
        return match ? parseInt(match[1], 10) : 0;
      };
      const parseStorage = (storage: string) => {
        const match = storage.match(/^(\d+)gb$/i);
        return match ? parseInt(match[1], 10) : storage === "1tb" ? 1024 : 0;
      };
      const API_URL = (
        import.meta.env.VITE_API_URL || "http://localhost:8000"
      ).replace(/\/$/, "");
      const response = await fetch(
        `${API_URL}/sell-phone/phones/${phoneId}/price?ram_gb=${parseRam(
          selectedRam,
        )}&storage_gb=${parseStorage(selectedStorage)}`,
      );
      if (!response.ok) throw new Error("Failed to fetch variant price");
      return response.json();
    },
    enabled: !!phoneId && !!selectedRam && !!selectedStorage,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Use dynamic base price if available, else fallback
  const basePrice = variantPrice?.base_price || phoneData?.Selling_Price || 0;

  // Fetch predicted price from backend
  const {
    data: predictionData,
    isLoading: isPredictionLoading,
    error: predictionError,
  } = useQuery({
    queryKey: [
      "pricePrediction",
      selectedRam,
      selectedStorage,
      selectedScreenCondition,
      deviceTurnsOn,
      hasOriginalBox,
      hasOriginalBill,
    ],
    queryFn: async () => {
      const API_URL = (
        import.meta.env.VITE_API_URL || "http://localhost:8000"
      ).replace(/\/$/, "");
      const response = await fetch(
        `${API_URL}/customer-side-prediction/predict-price`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone_details: getPhoneDetailsForAPI(),
            base_price: basePrice,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to fetch prediction");
      return response.json();
    },
    enabled:
      !!phoneData &&
      currentStep === 4 &&
      !!selectedRam &&
      !!selectedStorage &&
      !!selectedScreenCondition &&
      !!deviceTurnsOn &&
      !!hasOriginalBox &&
      !!hasOriginalBill,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Dynamically build options from variants (filter out null/invalid entries)
  const ramOptions =
    (variants?.rams || [])
      .filter((r: any) => typeof r === "number" && Number.isFinite(r) && r > 0)
      .map((ram: number) => ({
        id: `${ram}gb`,
        name: `${ram}GB`,
        priceAdjustment: 0, // Placeholder; adjust based on logic if needed
      })) || [];

  const storageOptions =
    (variants?.storages || [])
      .filter((s: any) => typeof s === "number" && Number.isFinite(s) && s > 0)
      .map((storage: number) => {
        const name = storage >= 1024 ? `${storage / 1024}TB` : `${storage}GB`;
        return {
          id: `${storage}gb`,
          name,
          priceAdjustment: 0, // Placeholder; adjust based on logic if needed
        };
      }) || [];

  if (isLoading) return <p>Loading phone details...</p>;
  if (error) return <p>Error loading phone: {error.message}</p>;
  if (!phoneData) return <p>Phone not found</p>;

  // Map DB fields to component structure
  const phone = {
    id: phoneData.id,
    name: phoneData.Brand + " " + phoneData.Model,
    brand: phoneData.Brand,
    image: `/assets/phones/${phoneData.id}.png`, // Fallback image
    basePrice,
    // Keep options as predefined (not in DB)
    ramOptions,
    storageOptions,
    screenConditions: [
      {
        id: "good",
        name: "Good",
        description: "No scratches, pristine condition",
        priceAdjustment: 0,
      },
      {
        id: "minor-scratches",
        name: "Minor Scratches",
        description: "Light scratches, barely visible",
        priceAdjustment: -2000,
      },
      {
        id: "major-scratches",
        name: "Major Scratches",
        description: "Visible scratches across screen",
        priceAdjustment: -5000,
      },
      {
        id: "cracked",
        name: "Cracked",
        description: "Screen has cracks but functional",
        priceAdjustment: -10000,
      },
      {
        id: "shattered",
        name: "Shattered",
        description: "Severely damaged screen",
        priceAdjustment: -15000,
      },
    ],
  };

  // Map selections to API payload
  const getPhoneDetailsForAPI = () => {
    // Updated to parse selectedRam dynamically
    const parseRam = (ram: string) => {
      const match = ram.match(/^(\d+)gb$/i);
      return match ? parseInt(match[1], 10) : 0;
    };
    const parseStorage = (storage: string) => {
      const match = storage.match(/^(\d+)gb$/i);
      return match ? parseInt(match[1], 10) : storage === "1tb" ? 1024 : 0;
    };
    return {
      brand: phone.brand,
      model: phoneData.Model, // Use from DB
      ram_gb: parseRam(selectedRam),
      storage_gb: parseStorage(selectedStorage),
      screen_condition: selectedScreenCondition,
      device_turns_on: deviceTurnsOn === "yes",
      has_original_box: hasOriginalBox === "yes",
      has_original_bill: hasOriginalBill === "yes",
    };
  };

  const canProceed = () => {
    if (currentStep === 1) {
      // Updated: If ramOptions exist, check selectedRam; else check customRamInput
      return ramOptions.length > 0 ? selectedRam !== "" : customRamInput !== "";
    }
    if (currentStep === 2) return selectedStorage !== "";
    if (currentStep === 3)
      return (
        selectedScreenCondition !== "" &&
        deviceTurnsOn !== "" &&
        hasOriginalBox !== "" &&
        hasOriginalBill !== ""
      );
    return true;
  };

  const progress = (currentStep / STEPS.length) * 100;

  // Helper: safe display for RAM/storage to avoid "null" or "NaN"
  const formatRamDisplay = (selRam: string) => {
    if (selRam) {
      const n = parseInt(String(selRam).replace(/gb$/i, ""), 10);
      if (Number.isFinite(n) && n > 0) return `${n}GB`;
    }
    if (phoneData?.RAM_GB) return `${phoneData.RAM_GB}GB`;
    return "unknown";
  };

  const formatStorageDisplay = (selStorage: string) => {
    if (selStorage) {
      if (/1tb/i.test(selStorage)) return "1TB";
      const n = parseInt(String(selStorage).replace(/gb$/i, ""), 10);
      if (Number.isFinite(n) && n > 0) return `${n}GB`;
    }
    if (phoneData?.Internal_Storage_GB)
      return `${phoneData.Internal_Storage_GB}GB`;
    return "unknown";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <main className="flex-grow flex items-center">
        <div className="container mx-auto px-4 py-8 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full max-h-[calc(100vh-200px)]">
            {/* Left Side - Question/Info Panel */}
            <div className="flex flex-col justify-between bg-white/40 backdrop-blur-sm rounded-3xl p-8 lg:p-12">
              {/* Header */}
              <div>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
                >
                  <ArrowLeft size={20} />
                  <span className="font-medium">Homepage</span>
                </Link>

                {/* Step indicator */}
                <div className="mb-8">
                  <p className="text-sm font-medium text-blue-600 mb-2">
                    step {currentStep}/{STEPS.length}
                  </p>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Question Title */}
                <div className="mb-8">
                  {currentStep === 1 && (
                    <>
                      <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
                        What is your RAM?
                      </h1>
                      <p className="text-gray-600 text-lg">
                        Select the RAM capacity
                      </p>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
                        Storage capacity?
                      </h1>
                      <p className="text-gray-600 text-lg">
                        Select your device storage
                      </p>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
                        Device Condition?
                      </h1>
                      <p className="text-gray-600 text-lg">
                        Help us assess your device
                      </p>
                    </>
                  )}
                  {currentStep === 4 && (
                    <>
                      <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
                        Your Final Quote
                      </h1>
                      <p className="text-gray-600 text-lg">
                        Based on your selections
                      </p>
                    </>
                  )}
                </div>

                {/* Phone Info Card */}
                <Card className="bg-white/60 backdrop-blur border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          phone.image ||
                          `https://placehold.co/100x100?text=${phone.name}`
                        }
                        alt={phone.name}
                        className="w-20 h-20 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            `https://placehold.co/100x100?text=${phone.name}`;
                        }}
                      />
                      <div>
                        <h3 className="font-bold text-lg">{phone.name}</h3>
                        <p className="text-sm text-gray-600">
                          {phone.brand}
                        </p>
                        {/* Safe dynamic RAM and Storage display */}
                        <p className="text-sm text-gray-600 mt-1">
                          RAM: {formatRamDisplay(selectedRam)} | Storage:{" "}
                          {formatStorageDisplay(selectedStorage)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom - Navigation */}
              <div>
                <div className="flex items-center justify-end">
                  <div className="flex gap-3">
                    {currentStep > 1 && currentStep < 4 && (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="rounded-full px-6"
                      >
                        Previous
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Options Panel */}
            <div className="flex flex-col justify-center">
              <div className="max-w-xl mx-auto w-full space-y-4">
                {/* Step 1: RAM Selection */}
                {currentStep === 1 &&
                  (ramOptions.length > 0 ? (
                    // Existing radio group if options available
                    <RadioGroup
                      value={selectedRam}
                      onValueChange={setSelectedRam}
                      className="space-y-4"
                    >
                      {ramOptions.map((ram) => (
                        <div key={ram.id}>
                          <RadioGroupItem
                            value={ram.id}
                            id={`ram-${ram.id}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`ram-${ram.id}`}
                            className="flex items-center gap-4 border-2 rounded-2xl p-5 cursor-pointer peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 hover:bg-white/80 bg-white/60 backdrop-blur transition-all hover:shadow-lg"
                          >
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                selectedRam === ram.id
                                  ? "border-blue-600 bg-blue-600"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedRam === ram.id && (
                                <div className="w-3 h-3 rounded-full bg-white" />
                              )}
                            </div>
                            <span className="font-semibold text-lg flex-grow">
                              {ram.name}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    // New input field if no options
                    <div className="space-y-4">
                      <Label
                        htmlFor="custom-ram"
                        className="text-lg font-semibold"
                      >
                        Enter RAM (GB)
                      </Label>
                      <input
                        id="custom-ram"
                        type="number"
                        value={customRamInput}
                        onChange={(e) => {
                          setCustomRamInput(e.target.value);
                          setSelectedRam(`${e.target.value}gb`); // Set selectedRam for consistency
                        }}
                        placeholder="e.g., 8"
                        className="w-full border-2 rounded-2xl p-5 bg-white/60 backdrop-blur focus:border-blue-600 focus:bg-blue-50 transition-all"
                      />
                    </div>
                  ))}

                {/* Step 2: Storage Selection */}
                {currentStep === 2 && (
                  <RadioGroup
                    value={selectedStorage}
                    onValueChange={setSelectedStorage}
                    className="space-y-4"
                  >
                    {phone.storageOptions.map((storage) => (
                      <div key={storage.id}>
                        <RadioGroupItem
                          value={storage.id}
                          id={`storage-${storage.id}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`storage-${storage.id}`}
                          className="flex items-center gap-4 border-2 rounded-2xl p-5 cursor-pointer peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 hover:bg-white/80 bg-white/60 backdrop-blur transition-all hover:shadow-lg"
                        >
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedStorage === storage.id
                                ? "border-blue-600 bg-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedStorage === storage.id && (
                              <div className="w-3 h-3 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="font-semibold text-lg flex-grow">
                            {storage.name}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Step 3: Condition Assessment */}
                {currentStep === 3 && (
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Screen Condition */}
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-700">
                        Screen Condition
                      </h4>
                      <RadioGroup
                        value={selectedScreenCondition}
                        onValueChange={setSelectedScreenCondition}
                        className="space-y-3"
                      >
                        {phone.screenConditions.map((condition) => (
                          <div key={condition.id}>
                            <RadioGroupItem
                              value={condition.id}
                              id={`screen-${condition.id}`}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={`screen-${condition.id}`}
                              className="flex items-start gap-3 border-2 rounded-2xl p-4 cursor-pointer peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 hover:bg-white/80 bg-white/60 backdrop-blur transition-all"
                            >
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                  selectedScreenCondition === condition.id
                                    ? "border-blue-600 bg-blue-600"
                                    : "border-gray-300"
                                }`}
                              >
                                {selectedScreenCondition === condition.id && (
                                  <div className="w-3 h-3 rounded-full bg-white" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <div className="font-semibold">
                                  {condition.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {condition.description}
                                </div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Device Turns On */}
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-700">
                        Device turns on?
                      </h4>
                      <RadioGroup
                        value={deviceTurnsOn}
                        onValueChange={setDeviceTurnsOn}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div>
                          <RadioGroupItem
                            value="yes"
                            id="turns-on-yes"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="turns-on-yes"
                            className="flex items-center justify-center gap-2 border-2 rounded-2xl p-4 cursor-pointer peer-data-[state=checked]:border-green-600 peer-data-[state=checked]:bg-green-50 hover:bg-white/80 bg-white/60 backdrop-blur transition-all"
                          >
                            <Check size={18} />
                            <span className="font-semibold">Yes</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="no"
                            id="turns-on-no"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="turns-on-no"
                            className="flex items-center justify-center gap-2 border-2 rounded-2xl p-4 cursor-pointer peer-data-[state=checked]:border-red-600 peer-data-[state=checked]:bg-red-50 hover:bg-white/80 bg-white/60 backdrop-blur transition-all"
                          >
                            <span className="font-semibold">No</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Original Box */}
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-700">
                        Original box?
                      </h4>
                      <RadioGroup
                        value={hasOriginalBox}
                        onValueChange={setHasOriginalBox}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div>
                          <RadioGroupItem
                            value="yes"
                            id="box-yes"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="box-yes"
                            className="flex items-center justify-center gap-2 border-2 rounded-2xl p-4 cursor-pointer peer-data-[state=checked]:border-green-600 peer-data-[state=checked]:bg-green-50 hover:bg-white/80 bg-white/60 backdrop-blur transition-all"
                          >
                            <Box size={18} />
                            <span className="font-semibold">Yes</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="no"
                            id="box-no"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="box-no"
                            className="flex items-center justify-center gap-2 border-2 rounded-2xl p-4 cursor-pointer peer-data-[state=checked]:border-gray-600 peer-data-[state=checked]:bg-gray-50 hover:bg-white/80 bg-white/60 backdrop-blur transition-all"
                          >
                            <span className="font-semibold">No</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Original Bill */}
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-700">
                        Original bill/invoice?
                      </h4>
                      <RadioGroup
                        value={hasOriginalBill}
                        onValueChange={setHasOriginalBill}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div>
                          <RadioGroupItem
                            value="yes"
                            id="bill-yes"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="bill-yes"
                            className="flex items-center justify-center gap-2 border-2 rounded-2xl p-4 cursor-pointer peer-data-[state=checked]:border-green-600 peer-data-[state=checked]:bg-green-50 hover:bg-white/80 bg-white/60 backdrop-blur transition-all"
                          >
                            <Check size={18} />
                            <span className="font-semibold">Yes</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="no"
                            id="bill-no"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="bill-no"
                            className="flex items-center justify-center gap-2 border-2 rounded-2xl p-4 cursor-pointer peer-data-[state=checked]:border-gray-600 peer-data-[state=checked]:bg-gray-50 hover:bg-white/80 bg-white/60 backdrop-blur transition-all"
                          >
                            <span className="font-semibold">No</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Step 4: Final Quote */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    {/* Price Card */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
                      <p className="text-sm opacity-90 mb-2">Estimated Value*</p>
                      {isPredictionLoading ? (
                        <p className="text-6xl font-bold mb-4">Loading...</p>
                      ) : predictionError ? (
                        <p className="text-6xl font-bold mb-4">Error</p>
                      ) : (
                        <p className="text-6xl font-bold mb-4">
                          ₹
                          {predictionData?.predicted_price?.toLocaleString() ||
                            "0"}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm opacity-90">
                        <Check size={16} />
                        <span>Instant payment upon verification</span>
                      </div>
                      <p className="text-xs opacity-75 mt-2">* This is estimated price and final price would be decided by the agent on visit</p>
                    </div>

                    {/* AI Reasoning */}
                    <div className="bg-white/80 backdrop-blur rounded-3xl p-6 max-h-[40vh] overflow-y-auto custom-scrollbar">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                          AI
                        </span>
                        Price Breakdown
                      </h4>
                      <div className="space-y-3">
                        {predictionData?.reasoning ? (
                          <div className="text-sm text-gray-700 pl-4 border-l-2 border-blue-300 py-1">
                            <ReactMarkdown>
                              {predictionData.reasoning}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700 pl-4 border-l-2 border-blue-300 py-1">
                            Loading reasoning...
                          </div>
                        )}
                        <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between font-bold">
                          <span>Estimated Price</span>
                          <span className="text-blue-600">
                            ₹
                            {predictionData?.predicted_price?.toLocaleString() ||
                              "0"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        const parseRam = (ram: string) => {
                          const match = ram.match(/^(\d+)gb$/i);
                          return match ? parseInt(match[1], 10) : 0;
                        };
                        const parseStorage = (storage: string) => {
                          const match = storage.match(/^(\d+)gb$/i);
                          return match
                            ? parseInt(match[1], 10)
                            : storage === "1tb"
                              ? 1024
                              : 0;
                        };

                        const saleData = {
                          name: phone.name,
                          brand: phoneData.Brand,
                          model: phoneData.Model,
                          ram_gb: parseRam(selectedRam),
                          storage_gb: parseStorage(selectedStorage),
                          variant:
                            `${selectedStorage}`.replace(/gb$/i, "") + "GB",
                          condition:
                            phone.screenConditions.find(
                              (c) => c.id === selectedScreenCondition,
                            )?.name || selectedScreenCondition,
                          price: predictionData?.predicted_price || 0,
                          conditionAnswers: {
                            screen_condition: selectedScreenCondition,
                            device_turns_on: deviceTurnsOn,
                            has_original_box: hasOriginalBox,
                            has_original_bill: hasOriginalBill,
                          },
                        };
                        // Persist selected sale details so checkout (or post-login flow) can pick it up
                        localStorage.setItem(
                          "phoneData",
                          JSON.stringify(saleData),
                        );
                        // mark that this login should resume the sale flow
                        localStorage.setItem("postLoginRedirect", "/checkout");
                        if (isLoggedIn) {
                          navigate("/checkout");
                        } else {
                          // Redirect to login (Login page will remain responsible for auth)
                          navigate("/login", {
                            state: { redirectTo: "/checkout" },
                          });
                        }
                      }}
                      className="w-full h-14 text-lg rounded-2xl"
                    >
                      Proceed to Sell <ArrowRight className="ml-2" />
                    </Button>
                  </div>
                )}

                {/* Next Button for steps 1-3 */}
                {currentStep < 4 && (
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      disabled={!canProceed()}
                      className="rounded-2xl px-8 py-6 text-lg"
                      size="lg"
                    >
                      Next
                      <ArrowRight className="ml-2" size={20} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
