import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface Props {
  // children is the protected element (e.g., <SellPhone />)
  children: React.ReactElement;
}

export default function ProtectedRoute({ children }: Props) {
  const { isLoggedIn, user } = useAuth();

  // allow only logged-in customers
  if (isLoggedIn && user?.role === "customer") {
    return children;
  }

  // otherwise redirect to login
  return <Navigate to="/login" replace />;
}
