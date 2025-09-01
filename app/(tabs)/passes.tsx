import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, Plus, Clock, Star, Infinity, Flame } from 'lucide-react-native';
import { supabase } from '@/src/lib/supabase';
import { createCheckout } from '@/src/lib/api';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from 'expo-router';
import { Pass, Purchase, CreditLedgerEntry } from '@/src/types/database';

export default function PassesScreen() {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState<number | null>(null);



  const fetchData = async () => {
    try {
      setLoading(true);
      
             // Fetch active passes
       const { data: passesData, error: passesError } = await supabase
         .from('passes')
         .select('*')
         .eq('is_active', true);

      console.log('Passes fetch result:', { data: passesData, error: passesError });
      console.log('Passes count:', passesData?.length || 0);
      if (passesData && passesData.length > 0) {
        console.log('First pass:', passesData[0]);
      }

      // Fetch user's purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .order('purchased_at', { ascending: false });

      console.log('Purchases fetch result:', { data: purchasesData, error: purchasesError });

      // Fetch credit ledger
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('credit_ledger')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Ledger fetch result:', { data: ledgerData, error: ledgerError });

             // Custom ordering for passes
       const customOrder = [
         'Single Class Pass',
         '5 Class Pass', 
         '10 Class Pass',
         '25 Class Pass',
         'Weekly Unlimited',
         'Monthly Unlimited',
         'VIP Monthly',
         'VIP Yearly'
       ];
       
       const sortedPasses = (passesData || []).sort((a, b) => {
         const aIndex = customOrder.indexOf(a.name);
         const bIndex = customOrder.indexOf(b.name);
         return aIndex - bIndex;
       });

       setPasses(sortedPasses);
       setPurchases(purchasesData || []);
       setLedger(ledgerData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const handlePurchase = async (pass: Pass) => {
    try {
      setPurchasing(pass.id);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to purchase passes');
        return;
      }
      
      const { url } = await createCheckout(pass.id, user.id);
      
      // Open browser and wait for result
      const result = await WebBrowser.openBrowserAsync(url);
      
      // Refresh data after browser closes
      await fetchData();
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to start checkout');
    } finally {
      setPurchasing(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (priceCents?: number, currency?: string) => {
    if (!priceCents) return 'Price not available';
    const price = (priceCents / 100).toFixed(2);
    return `$${price}`;
  };
  
  // Calculate balance from ledger
  const balance = ledger.reduce((sum, entry) => sum + entry.delta, 0);
  
  // Check if user has unlimited pass
  const hasUnlimitedPass = ledger.some(entry => 
    entry.reason === 'unlimited_pass_purchase' && 
    new Date(entry.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Within 30 days
  );
  
  // Calculate total classes used (negative entries)
  const classesUsed = Math.abs(ledger
    .filter(entry => entry.delta < 0)
    .reduce((sum, entry) => sum + entry.delta, 0));

  // Calculate total classes purchased (positive entries from purchases)
  const totalPurchased = ledger
    .filter(entry => entry.reason === 'pass_purchase')
    .reduce((sum, entry) => sum + entry.delta, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Class Passes</Text>
        <Text style={styles.subtitle}>Manage your credits</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Class Credits</Text>
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.creditsCard}
          >
            <View style={styles.creditsHeader}>
              {hasUnlimitedPass ? (
                <Infinity size={28} color="white" />
              ) : (
                <CreditCard size={28} color="white" />
              )}
              <View style={styles.creditsInfo}>
                <Text style={styles.creditsTitle}>
                  {hasUnlimitedPass ? 'Unlimited Access' : 'Available Classes'}
                </Text>
                <Text style={styles.creditsCount}>
                  {hasUnlimitedPass ? '∞' : balance}
                </Text>
              </View>
            </View>
            <View style={styles.creditsStats}>
              <View style={styles.creditsStat}>
                <Text style={styles.creditsStatLabel}>Classes Used</Text>
                <Text style={styles.creditsStatValue}>{classesUsed}</Text>
              </View>
              <View style={styles.creditsStat}>
                <Text style={styles.creditsStatLabel}>
                  {hasUnlimitedPass ? 'Unlimited Pass' : 'Total Purchased'}
                </Text>
                <Text style={styles.creditsStatValue}>
                  {hasUnlimitedPass ? 'Active' : totalPurchased}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buy New Passes</Text>
          {passes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No passes available</Text>
            </View>
          ) : (
            passes.map((pass) => (
              <View key={pass.id} style={styles.purchaseCard}>
                {pass.name.includes('10 Class') && (
                  <View style={styles.popularBadge}>
                    <Star size={12} color="white" />
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}
                {pass.name.includes('VIP') && (
                  <View style={styles.vipBadge}>
                    <Flame size={12} color="white" />
                    <Text style={styles.vipText}>VIP</Text>
                  </View>
                )}
                                 <View style={styles.purchaseHeader}>
                   <View style={styles.purchaseInfo}>
                     <Text style={styles.purchaseName}>{pass.name}</Text>
                     <Text style={styles.purchaseDescription}>
                       {pass.description}
                     </Text>
                   </View>
                   <Text style={styles.purchasePrice}>
                     {formatPrice(pass.price_cents, pass.currency)}
                   </Text>
                 </View>
                <View style={styles.purchaseDetails}>
                  <View style={styles.purchaseDetail}>
                    <Text style={styles.purchaseDetailLabel}>Classes:</Text>
                    <Text style={styles.purchaseDetailValue}>
                      {pass.unlimited ? (
                        <View style={styles.unlimitedContainer}>
                          <Infinity size={16} color="#FF6B35" />
                          <Text style={styles.unlimitedText}>Unlimited</Text>
                        </View>
                      ) : (
                        pass.credits
                      )}
                    </Text>
                  </View>
                  <View style={styles.purchaseDetail}>
                    <Text style={styles.purchaseDetailLabel}>Valid for:</Text>
                    <Text style={styles.purchaseDetailValue}>
                      {pass.validity_days ? `${pass.validity_days} days` : 'No expiry'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.purchaseButton,
                    purchasing === pass.id && styles.purchaseButtonDisabled
                  ]}
                  onPress={() => handlePurchase(pass)}
                  disabled={purchasing === pass.id}
                >
                  {purchasing === pass.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Plus size={16} color="white" />
                  )}
                  <Text style={styles.purchaseButtonText}>
                    {purchasing === pass.id ? 'Processing...' : 'Purchase'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase History</Text>
          {purchases.length === 0 ? (
            <View style={styles.emptyState}>
              <CreditCard size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No purchases yet</Text>
              <Text style={styles.emptyStateSubtext}>Buy your first pass to get started</Text>
            </View>
          ) : (
            purchases.map((purchase) => {
              const pass = passes.find(p => p.id === purchase.pass_id);
              return (
                <View key={purchase.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyType}>{pass?.name || 'Unknown Pass'}</Text>
                    <Text style={styles.historyPrice}>Purchased</Text>
                  </View>
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyClasses}>
                      {pass?.unlimited ? 'Unlimited access' : `+${pass?.credits || 0} classes`}
                    </Text>
                    <Text style={styles.historyDate}>
                      {formatDate(purchase.purchased_at)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  creditsCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  vipBadge: {
    position: 'absolute',
    top: -6,
    left: 16,
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  vipText: {
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
    fontSize: 18,
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
  unlimitedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unlimitedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  purchaseButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#ccc',
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});