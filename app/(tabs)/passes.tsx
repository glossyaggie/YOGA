import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, Plus, Clock, Star } from 'lucide-react-native';

// Simple credit system: All passes accumulate into total class credits
const userCredits = {
  totalClasses: 8, // Total remaining class credits
  purchaseHistory: [
    {
      id: 1,
      type: '10 Class Pack',
      purchasedAt: '2024-01-15',
      classesAdded: 10,
      price: 280,
    },
    {
      id: 2,
      type: '5 Class Pack', 
      purchasedAt: '2024-01-28',
      classesAdded: 5,
      price: 150,
    },
  ],
  classesUsed: 7, // Total classes attended
};

const availablePasses = [
  {
    id: 1,
    name: 'Single Class',
    price: 35,
    classes: 1,
    validity: '1 day',
    popular: false,
    description: 'Perfect for trying us out',
  },
  {
    id: 2,
    name: '5 Class Pack',
    price: 150,
    classes: 5,
    validity: '2 months',
    popular: false,
    description: 'Great for regular practice',
  },
  {
    id: 3,
    name: '10 Class Pack',
    price: 280,
    classes: 10,
    validity: '3 months',
    popular: true,
    description: 'Most popular choice',
  },
  {
    id: 4,
    name: 'Unlimited Monthly',
    price: 180,
    classes: 'Unlimited',
    validity: '1 month',
    popular: false,
    description: 'For dedicated practitioners',
  },
];

export default function PassesScreen() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Class Passes</Text>
        <Text style={styles.subtitle}>Manage your credits</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Class Credits</Text>
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.creditsCard}
          >
            <View style={styles.creditsHeader}>
              <CreditCard size={28} color="white" />
              <View style={styles.creditsInfo}>
                <Text style={styles.creditsTitle}>Available Classes</Text>
                <Text style={styles.creditsCount}>{userCredits.totalClasses}</Text>
              </View>
            </View>
            <View style={styles.creditsStats}>
              <View style={styles.creditsStat}>
                <Text style={styles.creditsStatLabel}>Classes Used</Text>
                <Text style={styles.creditsStatValue}>{userCredits.classesUsed}</Text>
              </View>
              <View style={styles.creditsStat}>
                <Text style={styles.creditsStatLabel}>Total Purchased</Text>
                <Text style={styles.creditsStatValue}>
                  {userCredits.purchaseHistory.reduce((sum, purchase) => sum + purchase.classesAdded, 0)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase History</Text>
          {userCredits.purchaseHistory.map((purchase) => (
            <View key={purchase.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyType}>{purchase.type}</Text>
                <Text style={styles.historyPrice}>${purchase.price}</Text>
              </View>
              <View style={styles.historyDetails}>
                <Text style={styles.historyClasses}>+{purchase.classesAdded} classes</Text>
                <Text style={styles.historyDate}>
                  {formatDate(purchase.purchasedAt)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buy New Passes</Text>
          {availablePasses.map((pass) => (
            <View key={pass.id} style={styles.purchaseCard}>
              {pass.popular && (
                <View style={styles.popularBadge}>
                  <Star size={12} color="white" />
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              <View style={styles.purchaseHeader}>
                <View style={styles.purchaseInfo}>
                  <Text style={styles.purchaseName}>{pass.name}</Text>
                  <Text style={styles.purchaseDescription}>
                    {pass.description}
                  </Text>
                </View>
                <Text style={styles.purchasePrice}>${pass.price}</Text>
              </View>
              <View style={styles.purchaseDetails}>
                <View style={styles.purchaseDetail}>
                  <Text style={styles.purchaseDetailLabel}>Classes:</Text>
                  <Text style={styles.purchaseDetailValue}>{pass.classes}</Text>
                </View>
                <View style={styles.purchaseDetail}>
                  <Text style={styles.purchaseDetailLabel}>Valid for:</Text>
                  <Text style={styles.purchaseDetailValue}>{pass.validity}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.purchaseButton}>
                <Plus size={16} color="white" />
                <Text style={styles.purchaseButtonText}>Purchase</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  creditsCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
  },
  creditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  creditsInfo: {
    flex: 1,
  },
  creditsTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  creditsCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  creditsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  creditsStat: {
    alignItems: 'center',
  },
  creditsStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  creditsStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyClasses: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  purchaseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -6,
    right: 16,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'white',
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  purchaseDescription: {
    fontSize: 13,
    color: '#666',
  },
  purchasePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  purchaseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  purchaseDetail: {
    alignItems: 'center',
  },
  purchaseDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  purchaseDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  purchaseButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    marginTop: -8,
  },
});