import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../../lib/api";
import { Order } from "../../types";
import { formatPrice, formatDate } from "../../utils/formatting";
import StatusBadge from "../../components/StatusBadge";

export default function LeadDetailScreen() {
  const { id, source } = useLocalSearchParams();
  const router = useRouter();
  const [lead, setLead] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchLeadDetail();
  }, [id]);

  const fetchLeadDetail = async () => {
    try {
      // Try marketplace first for available leads
      const marketplaceRes = await api.get<Order[]>(
        "/sell-phone/partner/leads/available",
      );
      let foundLead = marketplaceRes.data.find(
        (l: any) => (l.id || l.order_id)?.toString() === id,
      );

      if (!foundLead) {
        // Try locked deals
        try {
          const lockedRes = await api.get<Order[]>("/partner/locked-deals");
          foundLead = lockedRes.data.find((l: any) => l.id?.toString() === id);
        } catch (e) {
          // Ignore if locked-deals fails
        }
      }

      if (!foundLead) {
        // Try partner orders for purchased leads
        try {
          const ordersRes = await api.get<Order[]>("/partner/orders");
          foundLead = ordersRes.data.find((l: any) => l.id?.toString() === id);
        } catch (e) {
          // Ignore if orders fails
        }
      }

      // Map order_id to id for marketplace leads
      if (foundLead && !foundLead.id && (foundLead as any).order_id) {
        foundLead = { ...foundLead, id: (foundLead as any).order_id };
      }

      setLead(foundLead || null);
    } catch (error: any) {
      Alert.alert("Error", "Failed to fetch lead details");
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    if (!lead) return;

    setLocking(true);
    try {
      await api.post(`/sell-phone/partner/leads/${lead.id}/lock`);
      Alert.alert("Success", "Lead locked for 15 minutes", [
        {
          text: "Purchase Now",
          onPress: () => router.push(`/lead-purchase/${lead.id}`),
        },
        {
          text: "View Dashboard",
          onPress: () => router.push("/(tabs)/dashboard"),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Failed to lock lead",
      );
    } finally {
      setLocking(false);
    }
  };

  const handlePurchase = () => {
    if (!lead) return;
    router.push(`/lead-purchase/${lead.id}`);
  };

  const handleAssignAgent = () => {
    if (!lead) return;
    router.push(`/order-detail/${lead.id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!lead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Lead Not Found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Device Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.model}>{lead.phone_name}</Text>
            </View>
            <StatusBadge status="available" size="small" />
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Estimated Price</Text>
            <Text style={styles.priceValue}>
              {formatPrice(lead.ai_estimated_price || lead.final_quoted_price)}
            </Text>
          </View>

          <View style={styles.specs}>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>RAM</Text>
              <Text style={styles.specValue}>{lead.ram_gb}GB</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Storage</Text>
              <Text style={styles.specValue}>{lead.storage_gb}GB</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Color</Text>
              <Text style={styles.specValue}>{lead.color || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Customer Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{lead.customer_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{lead.customer_phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>
              {lead.customer_email || "Not provided"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>City:</Text>
            <Text style={styles.infoValue}>{lead.pickup_city}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pincode:</Text>
            <Text style={styles.infoValue}>{lead.pickup_pincode}</Text>
          </View>

          <View style={styles.addressRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.addressValue}>{lead.pickup_address_line}</Text>
          </View>
        </View>

        {/* Additional Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>{formatDate(lead.created_at)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lead ID:</Text>
            <Text style={styles.infoValue}>#{lead.id}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      {(source === "marketplace" ||
        source === "locked" ||
        source === "purchased") && (
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerLabel}>Lead Price</Text>
            <Text style={styles.footerPrice}>
              {formatPrice(lead.ai_estimated_price || lead.final_quoted_price)}
            </Text>
          </View>
          {source === "marketplace" && (
            <TouchableOpacity
              style={[styles.lockButton, locking && styles.lockButtonDisabled]}
              onPress={handleLock}
              disabled={locking}
            >
              {locking ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.lockButtonText}>🔒 Lock Deal</Text>
              )}
            </TouchableOpacity>
          )}
          {source === "locked" && (
            <TouchableOpacity
              style={[
                styles.lockButton,
                purchasing && styles.lockButtonDisabled,
              ]}
              onPress={handlePurchase}
              disabled={purchasing}
            >
              {purchasing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.lockButtonText}>💳 Purchase Deal</Text>
              )}
            </TouchableOpacity>
          )}
          {source === "purchased" && (
            <TouchableOpacity
              style={[
                styles.lockButton,
                assigning && styles.lockButtonDisabled,
              ]}
              onPress={handleAssignAgent}
              disabled={assigning}
            >
              {assigning ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.lockButtonText}>👤 Assign Agent</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backIconText: {
    fontSize: 24,
    color: "#111827",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: "#ffffff",
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  brand: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  model: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 4,
  },
  priceSection: {
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#16a34a",
  },
  specs: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  specItem: {
    alignItems: "center",
  },
  specLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  specValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  specDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  addressRow: {
    marginBottom: 12,
  },
  addressValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginTop: 4,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  footerInfo: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#16a34a",
  },
  lockButton: {
    flex: 2,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  lockButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  lockButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
