import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../lib/api';

interface SchedulePickupModalProps {
  visible: boolean;
  orderId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SchedulePickupModal({
  visible,
  orderId,
  onClose,
  onSuccess,
}: SchedulePickupModalProps) {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = async () => {
    setScheduling(true);
    try {
      // Format date as YYYY-MM-DD
      const pickupDate = date.toISOString().split('T')[0];
      // Format time as HH:MM
      const pickupTime = time.toTimeString().slice(0, 5);

      await api.post(`/agent/orders/${orderId}/schedule-pickup`, {
        scheduled_date: pickupDate,
        scheduled_time: pickupTime,
        notes: '',
      });

      Alert.alert('Success', 'Pickup scheduled successfully!', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess();
            onClose();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to schedule pickup');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Schedule Pickup</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Pickup Date</Text>
            <TouchableOpacity
              style={styles.inputButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.inputText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDate(selectedDate);
                }}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Pickup Time</Text>
            <TouchableOpacity
              style={styles.inputButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.inputText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selectedTime) setTime(selectedTime);
                }}
              />
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, scheduling && styles.confirmButtonDisabled]}
              onPress={handleSchedule}
              disabled={scheduling}
            >
              <Text style={styles.confirmButtonText}>
                {scheduling ? 'Scheduling...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#ffffff',
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
