/**
 * Partner Login/Signup Screen
 * Reference: SPEC Section - Partner Login Screen (/partner/login)
 * Features: Two modes (Login/Signup), form validation, API integration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validatePAN,
  validateGST,
  validatePincodes,
  validateRequired,
} from '../../utils/validation';
import { parsePincodes } from '../../utils/formatting';

export default function PartnerLoginScreen() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    company_name: '',
    business_address: '',
    gst_number: '',
    pan_number: '',
    serviceable_pincodes: '',
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Common validations
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    // Signup-only validations
    if (!isLogin) {
      const nameError = validateRequired(formData.full_name, 'Full Name');
      if (nameError) newErrors.full_name = nameError;

      const phoneError = validatePhone(formData.phone);
      if (phoneError) newErrors.phone = phoneError;

      const companyError = validateRequired(formData.company_name, 'Company Name');
      if (companyError) newErrors.company_name = companyError;

      const addressError = validateRequired(formData.business_address, 'Business Address');
      if (addressError) newErrors.business_address = addressError;

      const panError = validatePAN(formData.pan_number);
      if (panError) newErrors.pan_number = panError;

      const gstError = validateGST(formData.gst_number);
      if (gstError) newErrors.gst_number = gstError;

      const pincodesError = validatePincodes(formData.serviceable_pincodes);
      if (pincodesError) newErrors.serviceable_pincodes = pincodesError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password, 'partner');
        router.replace('/(tabs)/dashboard');
      } else {
        const pincodes = parsePincodes(formData.serviceable_pincodes);
        await signup(
          formData.full_name,
          formData.email,
          formData.password,
          formData.phone,
          formData.company_name,
          formData.business_address,
          formData.gst_number,
          formData.pan_number,
          pincodes
        );
        router.replace('/(tabs)/dashboard');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
        <View style={{ marginTop: 60, marginBottom: 30 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>
            {isLogin ? 'Partner Login' : 'Partner Application'}
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8 }}>
            {isLogin
              ? 'Login to manage your leads and agents'
              : 'Apply to become a verified partner. Your application will be reviewed by our team.'}
          </Text>
        </View>

        {/* Form Fields */}
        {!isLogin && (
          <>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Full Name *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: errors.full_name ? '#dc2626' : '#d1d5db',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: '#fff',
                }}
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                placeholder="Enter your full name"
              />
              {errors.full_name && (
                <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.full_name}</Text>
              )}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Phone Number *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: errors.phone ? '#dc2626' : '#d1d5db',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: '#fff',
                }}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                maxLength={10}
              />
              {errors.phone && (
                <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.phone}</Text>
              )}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Company/Business Name *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: errors.company_name ? '#dc2626' : '#d1d5db',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: '#fff',
                }}
                value={formData.company_name}
                onChangeText={(text) => setFormData({ ...formData, company_name: text })}
                placeholder="Enter company name"
              />
              {errors.company_name && (
                <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.company_name}</Text>
              )}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Business Address *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: errors.business_address ? '#dc2626' : '#d1d5db',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: '#fff',
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                value={formData.business_address}
                onChangeText={(text) => setFormData({ ...formData, business_address: text })}
                placeholder="Complete business address"
                multiline
                numberOfLines={3}
              />
              {errors.business_address && (
                <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.business_address}</Text>
              )}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>PAN Number *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: errors.pan_number ? '#dc2626' : '#d1d5db',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: '#fff',
                }}
                value={formData.pan_number}
                onChangeText={(text) => setFormData({ ...formData, pan_number: text.toUpperCase() })}
                placeholder="ABCDE1234F"
                maxLength={10}
                autoCapitalize="characters"
              />
              {errors.pan_number && (
                <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.pan_number}</Text>
              )}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>GST Number (Optional)</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: errors.gst_number ? '#dc2626' : '#d1d5db',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: '#fff',
                }}
                value={formData.gst_number}
                onChangeText={(text) => setFormData({ ...formData, gst_number: text.toUpperCase() })}
                placeholder="15-digit GST number"
                maxLength={15}
                autoCapitalize="characters"
              />
              {errors.gst_number && (
                <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.gst_number}</Text>
              )}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Serviceable Pincodes *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: errors.serviceable_pincodes ? '#dc2626' : '#d1d5db',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: '#fff',
                }}
                value={formData.serviceable_pincodes}
                onChangeText={(text) => setFormData({ ...formData, serviceable_pincodes: text })}
                placeholder="110001, 110002, 110003"
              />
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Enter all pincodes where you can provide pickup services
              </Text>
              {errors.serviceable_pincodes && (
                <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.serviceable_pincodes}</Text>
              )}
            </View>
          </>
        )}

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Email *</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: errors.email ? '#dc2626' : '#d1d5db',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              backgroundColor: '#fff',
            }}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && (
            <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.email}</Text>
          )}
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Password *</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: errors.password ? '#dc2626' : '#d1d5db',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              backgroundColor: '#fff',
            }}
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            placeholder="Minimum 8 characters"
            secureTextEntry
          />
          {errors.password && (
            <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.password}</Text>
          )}
        </View>

        {!isLogin && (
          <View style={{ backgroundColor: '#dbeafe', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: '#1e40af' }}>
              <Text style={{ fontWeight: 'bold' }}>Note:</Text> Your application will be reviewed by our team.
              You'll receive an email notification once your account is approved.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={{
            backgroundColor: '#2563eb',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              {isLogin ? 'Login' : 'Submit Application'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMode} style={{ alignItems: 'center' }}>
          <Text style={{ color: '#2563eb', fontSize: 14 }}>
            {isLogin ? "Don't have an account? Apply now" : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
