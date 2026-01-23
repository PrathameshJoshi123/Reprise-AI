/**
 * Agent Login Screen
 * Reference: SPEC Section - Agent Login Screen (/agent/login)
 * Features: Simple email/password login, no signup option
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/validation';

export default function AgentLoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    if (!password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password, 'agent');
      router.replace('/(agent-tabs)');
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.response?.data?.detail || 'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <View style={{ marginBottom: 40 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>
            Agent Login
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8 }}>
            Login to manage your assigned orders
          </Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Email</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: errors.email ? '#dc2626' : '#d1d5db',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              backgroundColor: '#fff',
            }}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && (
            <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.email}</Text>
          )}
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Password</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: errors.password ? '#dc2626' : '#d1d5db',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              backgroundColor: '#fff',
            }}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />
          {errors.password && (
            <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.password}</Text>
          )}
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: '#16a34a',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
          Contact your partner to get agent credentials
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
