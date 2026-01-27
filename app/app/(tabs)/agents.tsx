import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../lib/api";
import { Agent } from "../../types";
import EmptyState from "../../components/EmptyState";
import {
  validateEmail,
  validatePhone,
  validateRequired,
  validatePassword,
} from "../../utils/validation";

export default function AgentsScreen() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    employee_id: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchAgents = async () => {
    try {
      const response = await api.get<Agent[]>("/partner/agents");
      setAgents(response.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        Alert.alert("Error", "Failed to fetch agents");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAgents();
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const nameError = validateRequired(formData.full_name, "Full Name");
    if (nameError) {
      errors.full_name = nameError;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      errors.email = emailError;
    }

    const phoneError = validatePhone(formData.phone);
    if (phoneError) {
      errors.phone = phoneError;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      errors.password = passwordError;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAgent = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        employee_id: formData.employee_id || undefined,
      };
      await api.post("/partner/agents", payload);
      Alert.alert("Success", "Agent added successfully");
      setModalVisible(false);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        employee_id: "",
      });
      fetchAgents();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Failed to add agent",
      );
    }
  };

  const handleToggleStatus = async (
    agentId: number,
    currentStatus: boolean,
  ) => {
    try {
      await api.patch(`/partner/agents/${agentId}`, {
        is_active: !currentStatus,
      });
      Alert.alert(
        "Success",
        `Agent ${currentStatus ? "deactivated" : "activated"}`,
      );
      fetchAgents();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Failed to update agent status",
      );
    }
  };

  const filteredAgents = agents.filter(
    (agent) =>
      searchQuery === "" ||
      (agent.name &&
        agent.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (agent.email &&
        agent.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (agent.phone && agent.phone.includes(searchQuery)),
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Agents</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add Agent</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{agents.length}</Text>
          <Text style={styles.statLabel}>Total Agents</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {agents.filter((a) => a.is_active).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {agents.filter((a) => !a.is_active).length}
          </Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search agents..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Agents List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAgents.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No Agents Found"
            message={
              searchQuery
                ? "No agents match your search."
                : "Add agents to start assigning orders."
            }
          />
        ) : (
          <View style={styles.agentsList}>
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Agent Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Agent</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  formErrors.full_name && styles.inputError,
                ]}
                value={formData.full_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, full_name: text })
                }
                placeholder="Enter agent's full name"
              />
              {formErrors.full_name && (
                <Text style={styles.errorText}>{formErrors.full_name}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={[styles.input, formErrors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {formErrors.email && (
                <Text style={styles.errorText}>{formErrors.email}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={[styles.input, formErrors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                maxLength={10}
              />
              {formErrors.phone && (
                <Text style={styles.errorText}>{formErrors.phone}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={[styles.input, formErrors.password && styles.inputError]}
                value={formData.password}
                onChangeText={(text) =>
                  setFormData({ ...formData, password: text })
                }
                placeholder="Minimum 8 characters"
                secureTextEntry
              />
              {formErrors.password && (
                <Text style={styles.errorText}>{formErrors.password}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Employee ID (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.employee_id}
                onChangeText={(text) =>
                  setFormData({ ...formData, employee_id: text })
                }
                placeholder="Employee ID"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setFormData({
                    full_name: "",
                    email: "",
                    phone: "",
                    password: "",
                    employee_id: "",
                  });
                  setFormErrors({});
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddAgent}
              >
                <Text style={styles.submitButtonText}>Add Agent</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function AgentCard({
  agent,
  onToggleStatus,
}: {
  agent: Agent;
  onToggleStatus: (id: number, status: boolean) => void;
}) {
  return (
    <View style={styles.agentCard}>
      <View style={styles.agentHeader}>
        <View style={styles.agentAvatar}>
          <Text style={styles.agentAvatarText}>
            {agent.full_name ? agent.full_name.charAt(0).toUpperCase() : "?"}
          </Text>
        </View>

        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{agent.full_name || "Unknown"}</Text>
          <Text style={styles.agentEmail}>{agent.email || "No email"}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>📱 {agent.phone || "N/A"}</Text>
            <Text style={styles.metaText}>• ID #{agent.id}</Text>
          </View>
        </View>

        <View style={styles.agentActions}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: agent.is_active ? "#dcfce7" : "#fff0f0",
                borderColor: agent.is_active ? "#bbf7d0" : "#fecaca",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: agent.is_active ? "#16a34a" : "#dc2626" },
              ]}
            >
              {agent.is_active ? "Active" : "Inactive"}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.smallToggleButton,
              { borderColor: agent.is_active ? "#16a34a" : "#dc2626" },
            ]}
            onPress={() => onToggleStatus(agent.id, agent.is_active)}
          >
            <Text
              style={[
                styles.smallToggleButtonText,
                { color: agent.is_active ? "#16a34a" : "#dc2626" },
              ]}
            >
              {agent.is_active ? "Deactivate" : "Activate"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  addButton: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#ffffff",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  searchInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#111827",
  },
  content: {
    flex: 1,
  },
  agentsList: {
    padding: 16,
    gap: 16,
  },
  agentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  agentAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  agentInfo: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#6b7280",
  },
  agentActions: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  agentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  agentEmail: {
    fontSize: 13,
    color: "#6b7280",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  agentDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
  },
  toggleButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  smallToggleButton: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#ffffff",
  },
  smallToggleButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  inputError: {
    borderColor: "#dc2626",
  },
  errorText: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#16a34a",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
