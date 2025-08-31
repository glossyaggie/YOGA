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
import { useAuth } from '@/providers/auth-provider';
import { Calendar, CreditCard, Flame, Clock } from 'lucide-react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Book a Class',
      subtitle: 'Reserve your spot',
      icon: Calendar,
      color: '#FF6B35',
      onPress: () => router.push('/(tabs)/schedule'),
    },
    {
      title: 'Buy Passes',
      subtitle: 'Get class credits',
      icon: CreditCard,
      color: '#F7931E',
      onPress: () => router.push('/(tabs)/passes'),
    },
  ];

  const upcomingClasses = [
    {
      id: 1,
      name: 'Hot Vinyasa Flow',
      time: '6:00 PM',
      date: 'Today',
      instructor: 'Sarah Johnson',
      spots: 3,
    },
    {
      id: 2,
      name: 'Bikram 26 & 2',
      time: '7:30 AM',
      date: 'Tomorrow',
      instructor: 'Mike Chen',
      spots: 8,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#FF6B35', '#F7931E']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.user_metadata?.first_name || 'Yogi'}!</Text>
            <Text style={styles.subtitle}>Ready for your practice?</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Flame size={24} color="#FF6B35" />
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Classes This Month</Text>
            </View>
            <View style={styles.statCard}>
              <CreditCard size={24} color="#F7931E" />
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Passes Remaining</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.actionCard}
                    onPress={action.onPress}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                      <IconComponent size={24} color="white" />
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Classes</Text>
            {upcomingClasses.map((classItem) => (
              <TouchableOpacity key={classItem.id} style={styles.classCard}>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{classItem.name}</Text>
                  <Text style={styles.classInstructor}>with {classItem.instructor}</Text>
                  <View style={styles.classDetails}>
                    <View style={styles.classTime}>
                      <Clock size={14} color="#666" />
                      <Text style={styles.classTimeText}>
                        {classItem.date} at {classItem.time}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.classSpots}>
                  <Text style={styles.spotsNumber}>{classItem.spots}</Text>
                  <Text style={styles.spotsLabel}>spots left</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerContent: {
    marginTop: 20,
  },
  greeting: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
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
  quickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  classCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  classInstructor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  classDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classTimeText: {
    fontSize: 12,
    color: '#666',
  },
  classSpots: {
    alignItems: 'center',
  },
  spotsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  spotsLabel: {
    fontSize: 10,
    color: '#666',
  },
});