import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { 
  TrendingUp, 
  Calendar, 
  Flame, 
  Trophy, 
  Target, 
  Clock,
  Star,
  Zap,
  Settings
} from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../providers/auth-provider';
import colors from '../../constants/colors';

const { width } = Dimensions.get('window');

interface StatsData {
  lifetimeClasses: number;
  thisWeekClasses: number;
  thisMonthClasses: number;
  currentStreak: number;
  longestStreak: number;
  averageClassesPerWeek: number;
  totalHours: number;
  favoriteClass?: string;
  mostActiveDay?: string;
}

interface UserGoals {
  weeklyGoal: number;
  monthlyGoal: number;
}

export default function StatsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData>({
    lifetimeClasses: 0,
    thisWeekClasses: 0,
    thisMonthClasses: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageClassesPerWeek: 0,
    totalHours: 0,
  });
  const [userGoals, setUserGoals] = useState<UserGoals>({
    weeklyGoal: 5,
    monthlyGoal: 20,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGoalSettings, setShowGoalSettings] = useState(false);

  const fetchUserGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('weekly_goal, monthly_goal')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user goals:', error);
        
        // If columns don't exist, just use default goals
        if (error.message && error.message.includes('does not exist')) {
          console.log('Goal columns not found, using default goals');
          return;
        }
        return;
      }

      if (data) {
        setUserGoals({
          weeklyGoal: data.weekly_goal || 5,
          monthlyGoal: data.monthly_goal || 20,
        });
      }
    } catch (error) {
      console.error('Error fetching user goals:', error);
    }
  };

  const saveUserGoals = async (weeklyGoal: number, monthlyGoal: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          weekly_goal: weeklyGoal,
          monthly_goal: monthlyGoal,
        });

      if (error) {
        console.error('Error saving user goals:', error);
        
        // Check if it's a column doesn't exist error
        if (error.message && error.message.includes('does not exist')) {
          Alert.alert(
            'Database Update Required', 
            'The goal columns need to be added to the database first. Please run the SQL migration in your Supabase dashboard.',
            [
              { text: 'OK', style: 'default' }
            ]
          );
        }
        return false;
      }

      setUserGoals({ weeklyGoal, monthlyGoal });
      return true;
    } catch (error) {
      console.error('Error saving user goals:', error);
      return false;
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get all user's completed bookings (not cancelled)
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          class:classes(class_name, start_time, end_time)
        `)
        .eq('user_id', user.id)
        .is('cancelled_at', null)
        .order('booking_date', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate stats
      const lifetimeClasses = bookings.length;
      
      const thisWeekClasses = bookings.filter(booking => 
        new Date(booking.booking_date) >= startOfWeek
      ).length;

      const thisMonthClasses = bookings.filter(booking => 
        new Date(booking.booking_date) >= startOfMonth
      ).length;

      // Calculate streaks
      const sortedBookings = bookings.sort((a, b) => 
        new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()
      );

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      for (const booking of sortedBookings) {
        const bookingDate = new Date(booking.booking_date);
        bookingDate.setHours(0, 0, 0, 0);

        if (!lastDate) {
          tempStreak = 1;
          lastDate = bookingDate;
        } else {
          const dayDiff = Math.floor((bookingDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1) {
            tempStreak++;
          } else if (dayDiff > 1) {
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
            tempStreak = 1;
          }
          lastDate = bookingDate;
        }
      }

      // Check if current streak is the longest
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      // Calculate current streak (consecutive days from most recent booking)
      if (sortedBookings.length > 0) {
        const mostRecentBooking = new Date(sortedBookings[sortedBookings.length - 1].booking_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        mostRecentBooking.setHours(0, 0, 0, 0);

        const daysSinceLastClass = Math.floor((today.getTime() - mostRecentBooking.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastClass === 0) {
          // User attended class today, calculate current streak
          currentStreak = tempStreak;
        } else if (daysSinceLastClass === 1) {
          // User attended class yesterday, streak is still active
          currentStreak = tempStreak;
        } else {
          // Streak is broken
          currentStreak = 0;
        }
      }

      // Calculate average classes per week
      const weeksSinceFirstClass = sortedBookings.length > 0 
        ? Math.max(1, Math.ceil((now.getTime() - new Date(sortedBookings[0].booking_date).getTime()) / (1000 * 60 * 60 * 24 * 7)))
        : 1;
      const averageClassesPerWeek = Math.round((lifetimeClasses / weeksSinceFirstClass) * 10) / 10;

      // Calculate total hours (assuming average 1 hour per class)
      const totalHours = lifetimeClasses;

      // Find favorite class
      const classCounts: { [key: string]: number } = {};
      bookings.forEach(booking => {
        const className = booking.class?.class_name || 'Unknown';
        classCounts[className] = (classCounts[className] || 0) + 1;
      });
      const favoriteClass = Object.keys(classCounts).reduce((a, b) => 
        classCounts[a] > classCounts[b] ? a : b
      );

      // Find most active day
      const dayCounts: { [key: string]: number } = {};
      bookings.forEach(booking => {
        const day = new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long' });
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      const mostActiveDay = Object.keys(dayCounts).reduce((a, b) => 
        dayCounts[a] > dayCounts[b] ? a : b
      );

      setStats({
        lifetimeClasses,
        thisWeekClasses,
        thisMonthClasses,
        currentStreak,
        longestStreak,
        averageClassesPerWeek,
        totalHours,
        favoriteClass,
        mostActiveDay,
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
      fetchUserGoals();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return '#FF6B6B'; // Red for high streaks
    if (streak >= 3) return '#FFA726'; // Orange for medium streaks
    return '#4CAF50'; // Green for low streaks
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = colors.primary,
    showProgress = false,
    progressTarget = 0
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color?: string;
    showProgress?: boolean;
    progressTarget?: number;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Icon size={24} color={color} />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showProgress && progressTarget > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${getProgressPercentage(Number(value), progressTarget)}%`,
                  backgroundColor: color
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progressTarget} classes goal</Text>
        </View>
      )}
    </View>
  );

  const StreakCard = ({ current, longest }: { current: number; longest: number }) => (
    <View style={styles.streakCard}>
      <View style={styles.streakHeader}>
        <Flame size={28} color={getStreakColor(current)} />
        <Text style={styles.streakTitle}>Current Streak</Text>
      </View>
      <Text style={[styles.streakValue, { color: getStreakColor(current) }]}>
        {current} {current === 1 ? 'day' : 'days'}
      </Text>
      <Text style={styles.streakSubtitle}>
        Longest: {longest} {longest === 1 ? 'day' : 'days'}
      </Text>
      {current > 0 && (
        <View style={styles.streakFire}>
          {[...Array(Math.min(current, 5))].map((_, i) => (
            <Flame key={i} size={16} color={getStreakColor(current)} />
          ))}
        </View>
      )}
    </View>
  );

  const GoalSettingsModal = () => {
    const [tempWeeklyGoal, setTempWeeklyGoal] = useState(userGoals.weeklyGoal.toString());
    const [tempMonthlyGoal, setTempMonthlyGoal] = useState(userGoals.monthlyGoal.toString());

    // Update temp values when userGoals change
    useEffect(() => {
      setTempWeeklyGoal(userGoals.weeklyGoal.toString());
      setTempMonthlyGoal(userGoals.monthlyGoal.toString());
    }, [userGoals]);

    const handleSave = async () => {
      const weekly = parseInt(tempWeeklyGoal);
      const monthly = parseInt(tempMonthlyGoal);

      if (isNaN(weekly) || isNaN(monthly) || weekly < 1 || monthly < 1) {
        Alert.alert('Invalid Goals', 'Please enter valid numbers greater than 0');
        return;
      }

      const success = await saveUserGoals(weekly, monthly);
      if (success) {
        setShowGoalSettings(false);
        Alert.alert('Success', 'Your goals have been updated!');
      } else {
        Alert.alert('Error', 'Failed to save goals. Please try again.');
      }
    };

    return (
      <Modal
        visible={showGoalSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGoalSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Your Goals</Text>
              <TouchableOpacity
                onPress={() => setShowGoalSettings(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.goalInputContainer}>
              <Text style={styles.goalLabel}>Weekly Goal (classes)</Text>
              <TextInput
                style={styles.goalInput}
                value={tempWeeklyGoal}
                onChangeText={setTempWeeklyGoal}
                keyboardType="numeric"
                placeholder="5"
                placeholderTextColor={colors.gray}
              />
            </View>

            <View style={styles.goalInputContainer}>
              <Text style={styles.goalLabel}>Monthly Goal (classes)</Text>
              <TextInput
                style={styles.goalInput}
                value={tempMonthlyGoal}
                onChangeText={setTempMonthlyGoal}
                keyboardType="numeric"
                placeholder="20"
                placeholderTextColor={colors.gray}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowGoalSettings(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save Goals</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Your Stats</Text>
            <Text style={styles.subtitle}>Track your yoga journey</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowGoalSettings(true)}
          >
            <Settings size={24} color="white" />
            <Text style={styles.settingsButtonText}>Goals</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your stats...</Text>
          </View>
        ) : (
          <>
            {/* Main Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Lifetime Classes"
                value={stats.lifetimeClasses}
                subtitle="Total classes attended"
                icon={Trophy}
                color="#FFD700"
              />
                             <StatCard
                 title="This Week"
                 value={stats.thisWeekClasses}
                 subtitle="Classes this week"
                 icon={Calendar}
                 color="#4CAF50"
                 showProgress={true}
                 progressTarget={userGoals.weeklyGoal}
               />
            </View>

            <View style={styles.statsGrid}>
                             <StatCard
                 title="This Month"
                 value={stats.thisMonthClasses}
                 subtitle="Classes this month"
                 icon={TrendingUp}
                 color="#2196F3"
                 showProgress={true}
                 progressTarget={userGoals.monthlyGoal}
               />
              <StatCard
                title="Total Hours"
                value={stats.totalHours}
                subtitle="Hours of yoga"
                icon={Clock}
                color="#9C27B0"
              />
            </View>

            {/* Goal Settings Hint */}
            <View style={styles.goalHint}>
              <Text style={styles.goalHintText}>
                💡 Tap "Goals" in the header to customize your weekly and monthly targets
              </Text>
            </View>

            {/* Streak Card */}
            <StreakCard current={stats.currentStreak} longest={stats.longestStreak} />

            {/* Additional Stats */}
            <View style={styles.additionalStats}>
              <Text style={styles.sectionTitle}>More Insights</Text>
              
              <View style={styles.insightCard}>
                <Target size={20} color={colors.primary} />
                <Text style={styles.insightText}>
                  Average: <Text style={styles.insightHighlight}>{stats.averageClassesPerWeek}</Text> classes per week
                </Text>
              </View>

              {stats.favoriteClass && (
                <View style={styles.insightCard}>
                  <Star size={20} color="#FFD700" />
                  <Text style={styles.insightText}>
                    Favorite: <Text style={styles.insightHighlight}>{stats.favoriteClass}</Text>
                  </Text>
                </View>
              )}

              {stats.mostActiveDay && (
                <View style={styles.insightCard}>
                  <Zap size={20} color="#FF9800" />
                  <Text style={styles.insightText}>
                    Most active: <Text style={styles.insightHighlight}>{stats.mostActiveDay}</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Motivation Message */}
            <View style={styles.motivationCard}>
              <Text style={styles.motivationTitle}>Keep Going! 🧘‍♀️</Text>
              <Text style={styles.motivationText}>
                {stats.currentStreak > 0 
                  ? `Amazing! You're on a ${stats.currentStreak}-day streak. Keep the momentum going!`
                  : stats.lifetimeClasses > 0
                  ? "Every class is a step toward a healthier you. Ready for your next session?"
                  : "Start your yoga journey today! Book your first class and begin your transformation."
                }
              </Text>
                         </View>
           </>
         )}
       </ScrollView>
       
       <GoalSettingsModal />
     </SafeAreaView>
   );
 }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: colors.primary,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: colors.gray,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: colors.gray,
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray,
    marginLeft: 8,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  streakSubtitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 12,
  },
  streakFire: {
    flexDirection: 'row',
    gap: 4,
  },
  additionalStats: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightText: {
    fontSize: 14,
    color: colors.gray,
    marginLeft: 12,
    flex: 1,
  },
  insightHighlight: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  motivationCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.gray,
    fontWeight: 'bold',
  },
  goalInputContainer: {
    marginBottom: 20,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray,
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  goalHint: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  goalHintText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
  },
});
