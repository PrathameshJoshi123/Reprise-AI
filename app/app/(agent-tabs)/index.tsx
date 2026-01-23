import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { Order } from '../../types';
import { formatPrice, formatDate } from '../../utils/formatting';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import SchedulePickupModal from '../../components/SchedulePickupModal';
import CompletePickupModal from '../../components/CompletePickupModal';

export default function AgentDashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await api.get<Order[]>('/agent/orders');
      setOrders(response.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        Alert.alert('Error', 'Failed to fetch orders');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleAccept = async (orderId: number) => {
    try {
      await api.post(`/agent/orders/${orderId}/accept`);
      Alert.alert('Success', 'Order accepted successfully');
      fetchOrders();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to accept order');
    }
  };

  const handleReject = async (orderId: number) => {
    Alert.alert('Reject Order', 'Are you sure you want to reject this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/agent/orders/${orderId}/reject`, { rejection_reason: 'Agent rejected' });
            Alert.alert('Success', 'Order rejected');
            fetchOrders();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to reject order');
          }
        },
      },
    ]);
  };

  const handleSchedule = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowScheduleModal(true);
  };

  const handleComplete = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowCompleteModal(true);
  };

  const currentOrders = orders.filter((o) =>
    ['assigned_to_agent', 'accepted_by_agent', 'pickup_scheduled'].includes(o.status)
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333ea" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.agentName}>{user?.name || 'Agent'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currentOrders.length}</Text>
          <Text style={styles.statLabel}>Current Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {currentOrders.filter((o) => o.status === 'assigned_to_agent').length}
          </Text>
          <Text style={styles.statLabel}>Pending Accept</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {currentOrders.filter((o) => o.status === 'pickup_scheduled').length}
          </Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {currentOrders.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No Current Orders"
            message="You don't have any assigned orders at the moment. Check back soon!"
          />
        ) : (
          <View style={styles.ordersList}>
            {currentOrders.map((order) => (
              <AgentOrderCard
                key={order.id}
                order={order}
                onAccept={handleAccept}
                onReject={handleReject}
                onSchedule={handleSchedule}
                onComplete={handleComplete}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {selectedOrderId && (
        <>
          <SchedulePickupModal
            visible={showScheduleModal}
            orderId={selectedOrderId}
            onClose={() => {
              setShowScheduleModal(false);
              setSelectedOrderId(null);
            }}
            onSuccess={() => {
              fetchOrders();
            }}
          />
          <CompletePickupModal
            visible={showCompleteModal}
            orderId={selectedOrderId}
            onClose={() => {
              setShowCompleteModal(false);
              setSelectedOrderId(null);
            }}
            onSuccess={() => {
              fetchOrders();
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

function AgentOrderCard({
  order,
  onAccept,
  onReject,
  onSchedule,
  onComplete,
}: {
  order: Order;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onSchedule: (id: number) => void;
  onComplete: (id: number) => void;
}) {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderBrand}>{order.brand}</Text>
          <Text style={styles.orderModel}>{order.model}</Text>
        </View>
        <StatusBadge status={order.status} size="small" />
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.orderSpec}>
          {order.ram_gb}GB RAM • {order.storage_gb}GB
        </Text>
        <Text style={styles.orderPrice}>{formatPrice(order.ai_estimated_price || order.final_quoted_price)}</Text>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.infoLabel}>Customer:</Text>
        <Text style={styles.infoValue}>{order.customer_name}</Text>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.infoLabel}>Phone:</Text>
        <Text style={styles.infoValue}>{order.customer_phone}</Text>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.infoLabel}>Location:</Text>
        <Text style={styles.infoValue}>
          {order.pickup_address_line}, {order.pickup_city}
        </Text>
      </View>

      {order.pickup_date && (
        <View style={styles.pickupInfo}>
          <Text style={styles.pickupLabel}>📅 Pickup Scheduled</Text>
          <Text style={styles.pickupDate}>
            {formatDate(order.pickup_date)} at {order.pickup_time}
          </Text>
        </View>
      )}

      <View style={styles.orderActions}>
        {order.status === 'assigned_to_agent' && (
          <>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => onAccept(order.id)}
            >
              <Text style={styles.acceptButtonText}>Accept Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => onReject(order.id)}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}
        {order.status === 'accepted_by_agent' && (
          <TouchableOpacity 
            style={styles.scheduleButton}
            onPress={() => onSchedule(order.id)}
          >
            <Text style={styles.scheduleButtonText}>Schedule Pickup</Text>
          </TouchableOpacity>
        )}
        {order.status === 'pickup_scheduled' && (
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={() => onComplete(order.id)}
          >
            <Text style={styles.completeButtonText}>Complete Pickup</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  welcomeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  agentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9333ea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  ordersList: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderBrand: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  orderModel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderSpec: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  orderInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    width: 80,
  },
  infoValue: {
    fontSize: 13,
    color: '#111827',
    flex: 1,
    fontWeight: '500',
  },
  pickupInfo: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  pickupLabel: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '600',
    marginBottom: 4,
  },
  pickupDate: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: 'bold',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  rejectButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#9333ea',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
