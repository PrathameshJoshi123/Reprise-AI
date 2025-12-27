import { Slot } from "expo-router";
import React from "react";
import { DiagnosticProvider } from "./context";

export default function DiagnosticLayout() {
  return (
    <DiagnosticProvider>
      <Slot />
    </DiagnosticProvider>
  );
}
