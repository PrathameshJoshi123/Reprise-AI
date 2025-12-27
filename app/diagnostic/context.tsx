import React, { createContext, ReactNode, useContext, useState } from "react";

// Diagnostic Results Interface
export interface DiagnosticResults {
  hardware: {
    brand: string;
    model: string;
    ram_gb: number;
    os_version: string;
    isDevice: boolean;
  };
  tests: {
    touchscreen: "PASSED" | "FAILED" | "PENDING";
    microphone: "PASSED" | "FAILED" | "PENDING";
    speaker: "PASSED" | "FAILED" | "PENDING";
    gyroscope: "PASSED" | "FAILED" | "PENDING";
    proximity: "PASSED" | "FAILED" | "PENDING";
  };
}

interface DiagnosticContextType {
  results: DiagnosticResults;
  updateHardware: (hardware: DiagnosticResults["hardware"]) => void;
  updateTest: (
    testName: keyof DiagnosticResults["tests"],
    status: "PASSED" | "FAILED"
  ) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resetDiagnostic: () => void;
}

const DiagnosticContext = createContext<DiagnosticContextType | undefined>(
  undefined
);

export const useDiagnostic = () => {
  const context = useContext(DiagnosticContext);
  if (!context) {
    throw new Error("useDiagnostic must be used within DiagnosticProvider");
  }
  return context;
};

export const DiagnosticProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<DiagnosticResults>({
    hardware: {
      brand: "",
      model: "",
      ram_gb: 0,
      os_version: "",
      isDevice: false,
    },
    tests: {
      touchscreen: "PENDING",
      microphone: "PENDING",
      speaker: "PENDING",
      gyroscope: "PENDING",
      proximity: "PENDING",
    },
  });

  const updateHardware = (hardware: DiagnosticResults["hardware"]) => {
    setResults((prev) => ({ ...prev, hardware }));
  };

  const updateTest = (
    testName: keyof DiagnosticResults["tests"],
    status: "PASSED" | "FAILED"
  ) => {
    setResults((prev) => ({
      ...prev,
      tests: { ...prev.tests, [testName]: status },
    }));
  };

  const resetDiagnostic = () => {
    setCurrentStep(0);
    setResults({
      hardware: {
        brand: "",
        model: "",
        ram_gb: 0,
        os_version: "",
        isDevice: false,
      },
      tests: {
        touchscreen: "PENDING",
        microphone: "PENDING",
        speaker: "PENDING",
        gyroscope: "PENDING",
        proximity: "PENDING",
      },
    });
  };

  return (
    <DiagnosticContext.Provider
      value={{
        results,
        updateHardware,
        updateTest,
        currentStep,
        setCurrentStep,
        resetDiagnostic,
      }}
    >
      {children}
    </DiagnosticContext.Provider>
  );
};
