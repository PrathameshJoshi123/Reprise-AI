import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  CheckCircle2,
  Camera,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react";

interface PhoneCondition {
  screen_condition: boolean;
  touchscreen_working: boolean;
  camera_working: boolean;
  microphone_working: boolean;
  speaker_working: boolean;
  battery_health: string;
  body_condition: string;
  has_original_box: boolean;
  has_original_charger: boolean;
  has_original_bill: boolean;
}

interface CompletePickupChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    phone_conditions: PhoneCondition;
    photos: File[];
    final_offered_price: number;
    customer_accepted: boolean;
    pickup_notes: string;
    payment_method: string;
  }) => Promise<void>;
  isLoading: boolean;
  estimatedPrice: number;
  deviceName: string;
}

type ChecklistStepType =
  | "checklist"
  | "photo_guide"
  | "photo_capture"
  | "condition_details"
  | "review";

export default function CompletePickupChecklist({
  isOpen,
  onClose,
  onComplete,
  isLoading,
  estimatedPrice,
  deviceName,
}: CompletePickupChecklistProps) {
  const [currentStep, setCurrentStep] =
    useState<ChecklistStepType>("checklist");
  const [conditions, setConditions] = useState<PhoneCondition>({
    screen_condition: true,
    touchscreen_working: true,
    camera_working: true,
    microphone_working: true,
    speaker_working: true,
    battery_health: "Good",
    body_condition: "Good",
    has_original_box: false,
    has_original_charger: false,
    has_original_bill: false,
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [currentPhotoStep, setCurrentPhotoStep] = useState(0);
  const [finalPrice, setFinalPrice] = useState(estimatedPrice);
  const [customerAccepted, setCustomerAccepted] = useState(false);
  const [pickupNotes, setPickupNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const photoSteps = [
    {
      name: "Front View",
      description: "Take a clear photo of the front of the device",
    },
    {
      name: "Back View",
      description: "Take a clear photo of the back of the device",
    },
    {
      name: "Screen",
      description: "Take a photo showing the screen and any damage",
    },
    {
      name: "Sides & Ports",
      description: "Capture all ports and side conditions",
    },
  ];

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setPhotos([...photos, file]);
        if (currentPhotoStep < photoSteps.length - 1) {
          setCurrentPhotoStep(currentPhotoStep + 1);
        } else {
          setCurrentStep("condition_details");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConditionChange = (key: keyof PhoneCondition, value: any) => {
    setConditions({ ...conditions, [key]: value });
  };

  const handleComplete = async () => {
    if (photos.length === 0) {
      alert("Please capture at least one photo");
      return;
    }

    if (!customerAccepted) {
      alert("Please confirm customer acceptance");
      return;
    }

    if (!paymentMethod) {
      alert("Please select a payment method");
      return;
    }

    try {
      await onComplete({
        phone_conditions: conditions,
        photos,
        final_offered_price: finalPrice,
        customer_accepted: customerAccepted,
        pickup_notes: pickupNotes,
        payment_method: paymentMethod,
      });
      onClose();
    } catch (error) {
      console.error("Error completing pickup:", error);
    }
  };

  const canProceedToPhotos = Object.values(conditions).every(
    (v) => v !== null && v !== "",
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Complete Pickup - {deviceName}
          </DialogTitle>
          <DialogDescription>
            Follow the steps below to complete the pickup process
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex gap-2 flex-wrap">
            {[
              { step: "checklist" as ChecklistStepType, label: "Checklist" },
              {
                step: "photo_guide" as ChecklistStepType,
                label: "Photo Guide",
              },
              {
                step: "photo_capture" as ChecklistStepType,
                label: "Capture Photos",
              },
              {
                step: "condition_details" as ChecklistStepType,
                label: "Condition Details",
              },
              { step: "review" as ChecklistStepType, label: "Review" },
            ].map(({ step, label }) => (
              <div
                key={step}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentStep === step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Step 1: Checklist */}
          {currentStep === "checklist" && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Physical Inspection Checklist
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      key: "screen_condition",
                      label: "Screen is intact and working",
                    },
                    {
                      key: "touchscreen_working",
                      label: "Touchscreen is responsive",
                    },
                    { key: "camera_working", label: "Camera is working" },
                    {
                      key: "microphone_working",
                      label: "Microphone is working",
                    },
                    { key: "speaker_working", label: "Speaker is working" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={
                          conditions[key as keyof PhoneCondition] as boolean
                        }
                        onChange={(e) =>
                          handleConditionChange(
                            key as keyof PhoneCondition,
                            e.target.checked,
                          )
                        }
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-gray-800">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-3">
                  Accessories & Documents
                </h3>
                <div className="space-y-3">
                  {[
                    { key: "has_original_box", label: "Has Original Box" },
                    {
                      key: "has_original_charger",
                      label: "Has Original Charger",
                    },
                    { key: "has_original_bill", label: "Has Original Bill" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={
                          conditions[key as keyof PhoneCondition] as boolean
                        }
                        onChange={(e) =>
                          handleConditionChange(
                            key as keyof PhoneCondition,
                            e.target.checked,
                          )
                        }
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-gray-800">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setCurrentStep("photo_guide")}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!canProceedToPhotos}
              >
                Next: Photo Guide
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Photo Guide */}
          {currentStep === "photo_guide" && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Photo Capture Guide
                </h3>
                <p className="text-sm text-purple-800 mb-4">
                  Please take clear photos from the following angles. Good
                  lighting is important for quality assessment.
                </p>
                <div className="space-y-2">
                  {photoSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded border border-purple-200"
                    >
                      <div className="font-medium text-gray-900">
                        {idx + 1}. {step.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {step.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded border border-amber-200 flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Ensure good lighting and clear focus. Photos will be used for
                  quality verification.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("checklist")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    setCurrentStep("photo_capture");
                    setCurrentPhotoStep(0);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Start Capturing Photos
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Photo Capture */}
          {currentStep === "photo_capture" && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {photoSteps[currentPhotoStep]?.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {photoSteps[currentPhotoStep]?.description}
                </p>
              </div>

              {photoPreview && (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden max-h-96 flex items-center justify-center">
                  <img
                    src={photoPreview}
                    alt="preview"
                    className="max-w-full max-h-full"
                  />
                </div>
              )}

              <div className="flex items-center justify-center">
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                  <div className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Capture Photo
                  </div>
                </label>
              </div>

              <div className="text-sm text-gray-600 text-center">
                Photo {photos.length + (photoPreview ? 1 : 0)} of{" "}
                {photoSteps.length}
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative bg-gray-100 rounded">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`photo-${idx}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <button
                        onClick={() => {
                          setPhotos(photos.filter((_, i) => i !== idx));
                        }}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("photo_guide")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep("condition_details")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={photos.length === 0}
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Condition Details */}
          {currentStep === "condition_details" && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Detailed Condition Assessment
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700 font-medium mb-2 block">
                      Battery Health
                    </Label>
                    <Select
                      value={conditions.battery_health}
                      onValueChange={(value) =>
                        handleConditionChange("battery_health", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">
                          Excellent (80%+)
                        </SelectItem>
                        <SelectItem value="Good">Good (60-80%)</SelectItem>
                        <SelectItem value="Fair">Fair (40-60%)</SelectItem>
                        <SelectItem value="Poor">Poor (Below 40%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-700 font-medium mb-2 block">
                      Body Condition
                    </Label>
                    <Select
                      value={conditions.body_condition}
                      onValueChange={(value) =>
                        handleConditionChange("body_condition", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">
                          Excellent - No scratches
                        </SelectItem>
                        <SelectItem value="Good">
                          Good - Minor scratches
                        </SelectItem>
                        <SelectItem value="Fair">
                          Fair - Visible wear & tear
                        </SelectItem>
                        <SelectItem value="Poor">
                          Poor - Significant damage
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-700 font-medium mb-2 block">
                      Final Offered Price (₹)
                    </Label>
                    <Input
                      type="number"
                      value={finalPrice}
                      onChange={(e) =>
                        setFinalPrice(parseFloat(e.target.value) || 0)
                      }
                      placeholder="Enter final price"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Estimated: ₹{estimatedPrice.toFixed(0)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-700 font-medium mb-2 block">
                      Payment Method
                    </Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Bank Transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-700 font-medium mb-2 block">
                      Customer Acceptance
                    </Label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-white border rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={customerAccepted}
                        onChange={(e) => setCustomerAccepted(e.target.checked)}
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-gray-800 font-medium">
                        Customer accepted the final offer
                      </span>
                    </label>
                  </div>

                  <div>
                    <Label className="text-gray-700 font-medium mb-2 block">
                      Additional Notes (Optional)
                    </Label>
                    <Textarea
                      value={pickupNotes}
                      onChange={(e) => setPickupNotes(e.target.value)}
                      placeholder="Any additional observations or notes"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("photo_capture")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep("review")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!customerAccepted || !paymentMethod}
                >
                  Review & Complete
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === "review" && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-3">
                  Pickup Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Photos Captured:</span>
                    <span className="font-medium">{photos.length} / 4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Battery Health:</span>
                    <span className="font-medium">
                      {conditions.battery_health}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Body Condition:</span>
                    <span className="font-medium">
                      {conditions.body_condition}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Final Price:</span>
                    <span className="font-medium text-green-700">
                      ₹{finalPrice.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Payment Method:</span>
                    <span className="font-medium">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Customer Acceptance:</span>
                    <span className="font-medium text-green-700">
                      ✓ Confirmed
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("condition_details")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Completing..." : "Complete Pickup"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
