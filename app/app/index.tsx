import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { user, userType, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect authenticated users to their respective dashboards
      if (userType === 'partner') {
        router.replace('/(tabs)');
      } else if (userType === 'agent') {
        router.replace('/(agent-tabs)');
      }
    }
  }, [isAuthenticated, isLoading, user, userType]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Welcome to RepriseAi</Text>
        <Text style={styles.heroSubtitle}>
          India's Leading Phone Trade-In Platform
        </Text>
        <Text style={styles.heroDescription}>
          Connect with customers, manage orders, and grow your business with our comprehensive partner-agent ecosystem.
        </Text>
      </View>

      {/* Dual CTA Buttons */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={[styles.ctaButton, styles.partnerButton]}
          onPress={() => router.push('/(auth)/partner-login')}
        >
          <Text style={styles.ctaButtonText}>Get Started as Partner</Text>
          <Text style={styles.ctaButtonSubtext}>Manage orders & agents</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctaButton, styles.agentButton]}
          onPress={() => router.push('/(auth)/agent-login')}
        >
          <Text style={styles.ctaButtonText}>Join as Agent</Text>
          <Text style={styles.ctaButtonSubtext}>Complete pickups & earn</Text>
        </TouchableOpacity>
      </View>

      {/* Feature Highlights */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Why Choose RepriseAi?</Text>
        
        <View style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <Text style={styles.featureIconText}>🎯</Text>
          </View>
          <Text style={styles.featureTitle}>Lead Management</Text>
          <Text style={styles.featureDescription}>
            Lock and purchase high-quality leads with transparent pricing and instant availability.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <Text style={styles.featureIconText}>👥</Text>
          </View>
          <Text style={styles.featureTitle}>Agent Network</Text>
          <Text style={styles.featureDescription}>
            Build and manage your team of field agents to handle pickups efficiently across multiple locations.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <Text style={styles.featureIconText}>💰</Text>
          </View>
          <Text style={styles.featureTitle}>Flexible Credits</Text>
          <Text style={styles.featureDescription}>
            Pay-as-you-go credit system with multiple plans to suit your business needs.
          </Text>
        </View>
      </View>

      {/* Statistics Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Our Impact</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>10,000+</Text>
            <Text style={styles.statLabel}>Active Partners</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>50,000+</Text>
            <Text style={styles.statLabel}>Orders Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>₹5 Cr+</Text>
            <Text style={styles.statLabel}>Value Processed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>100+</Text>
            <Text style={styles.statLabel}>Cities Covered</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 RepriseAi. All rights reserved.</Text>
        <View style={styles.footerLinks}>
          <Text style={styles.footerLink}>Terms of Service</Text>
          <Text style={styles.footerDivider}>•</Text>
          <Text style={styles.footerLink}>Privacy Policy</Text>
          <Text style={styles.footerDivider}>•</Text>
          <Text style={styles.footerLink}>Contact Us</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  heroSection: {
    backgroundColor: '#2563eb',
    padding: 32,
    paddingTop: 60,
    paddingBottom: 48,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 600,
  },
  ctaSection: {
    padding: 24,
    gap: 16,
  },
  ctaButton: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  partnerButton: {
    backgroundColor: '#16a34a',
  },
  agentButton: {
    backgroundColor: '#9333ea',
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  ctaButtonSubtext: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  featuresSection: {
    padding: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIconText: {
    fontSize: 28,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  statsSection: {
    padding: 24,
    backgroundColor: '#ffffff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: '#2563eb',
  },
  footerDivider: {
    fontSize: 12,
    color: '#d1d5db',
  },
});
