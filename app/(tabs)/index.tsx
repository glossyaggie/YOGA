import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/providers/auth-provider';
import { Calendar, Clock, User, Settings, Flame, Plus, CreditCard, Infinity } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { CreditLedgerEntry } from '@/src/types/database';
import { cancelBooking } from '../../src/lib/api';

export default function HomeScreen() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [hasUnlimitedPass, setHasUnlimitedPass] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [nextClass, setNextClass] = useState<any>(null);
  const [todaysClasses, setTodaysClasses] = useState<any[]>([]);
  const [unbooking, setUnbooking] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');

  const fetchUserProfile = async () => {
    try {
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results

      if (error) {
        console.error('Error fetching profile:', error);
        // Fallback to email prefix if profile fetch fails
        setUserName(user.email?.split('@')[0] || 'there');
      } else if (profile?.first_name) {
        setUserName(profile.first_name);
      } else {
        // No profile found or no first name - try to create profile from user metadata
        console.log('No profile found, attempting to create from user metadata');
        
        // Try to extract first name from user metadata or email
        let firstName = '';
        
        // Check if user has metadata with first name
        if (user.user_metadata?.first_name) {
          firstName = user.user_metadata.first_name;
        } else if (user.user_metadata?.full_name) {
          // Extract first name from full name
          firstName = user.user_metadata.full_name.split(' ')[0];
        } else if (user.email) {
          // Extract from email (before @ symbol)
          firstName = user.email.split('@')[0];
          // Capitalize first letter
          firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
        }
        
        setUserName(firstName || 'there');
        
        // Optionally create the profile record for future use
        try {
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              first_name: firstName,
              email: user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        } catch (profileCreateError) {
          console.error('Error creating profile:', profileCreateError);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUserName(user?.email?.split('@')[0] || 'there');
    }
  };

  const fetchCredits = async () => {
    try {
      setLoading(true);
      
      // Fetch credit ledger for the current user
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('credit_ledger')
        .select('*')
        .order('created_at', { ascending: false });

      if (ledgerError) {
        console.error('Error fetching credits:', ledgerError);
        return;
      }

      // Calculate current balance
      const balance = (ledgerData || []).reduce((sum, entry) => sum + entry.delta, 0);
      
      // Check if user has unlimited pass (within last 30 days)
      const hasUnlimited = (ledgerData || []).some(entry => 
        entry.reason === 'unlimited_pass_purchase' && 
        new Date(entry.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );

      setCredits(balance);
      setHasUnlimitedPass(hasUnlimited);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookings = async () => {
    try {
      if (!user) return;

      // Get user's next booked class with class details
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          class:classes(
            class_name,
            instructor,
            start_time,
            end_time,
            level,
            temperature_celsius,
            description
          )
        `)
        .eq('user_id', user.id)
        .is('cancelled_at', null)
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date, class(start_time)')
        .limit(1);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      } else if (bookings && bookings.length > 0) {
        const booking = bookings[0];
        const classData = booking.class;
        
        // Use real class data from the joined query
        setNextClass({
          id: booking.id,
          name: classData?.class_name || 'Booked Class',
          time: classData?.start_time?.substring(0, 5) || '00:00',
          instructor: classData?.instructor || 'Instructor',
          level: classData?.level || 'All Levels',
          temperature: classData?.temperature_celsius ? `${classData.temperature_celsius}°C` : 'Room temp',
          date: booking.booking_date || new Date().toISOString().split('T')[0]
        });
      } else {
        // No bookings found, clear the next class
        setNextClass(null);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleUnbookClass = async (bookingId: number) => {
    try {
      setUnbooking(true);
      await cancelBooking(bookingId);
      Alert.alert('Success', 'Class cancelled successfully! Credit has been refunded.');
      await fetchCredits(); // Refresh credits
      await fetchUserBookings(); // Refresh next class
    } catch (error) {
      console.error('Unbook error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel class';
      Alert.alert('Cancellation Error', errorMessage);
    } finally {
      setUnbooking(false);
    }
  };

  const fetchTodaysClasses = async () => {
    try {
      const today = new Date().getDay(); // Get current day of week (0-6)
      
      const { data: classes, error } = await supabase
        .from('classes')
        .select('*')
        .eq('day_of_week', today)
        .eq('is_active', true)
        .order('start_time');

      if (error) {
        console.error('Error fetching today\'s classes:', error);
      } else {
        // Filter out classes that have already started
        const now = new Date();
        const currentTime = now.toTimeString().substring(0, 5); // Format: HH:MM
        
        const filteredClasses = (classes || []).filter(c => 
          c.start_time > currentTime // Only show classes that haven't started yet
        );
        
        const formattedClasses = filteredClasses.map(c => ({
          time: c.start_time?.substring(0, 5) || '00:00',
          name: c.class_name || 'Class',
          instructor: c.instructor || 'Instructor',
          spots: c.max_capacity // For now, assume all spots available since we don't have booking tracking yet
        }));
        setTodaysClasses(formattedClasses);
      }
    } catch (error) {
      console.error('Error fetching today\'s classes:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('Home focus');
      fetchUserProfile();
      fetchCredits();
      fetchUserBookings();
      fetchTodaysClasses();
      return () => console.log('Home blur');
    }, [user])
  );

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };



  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hi, {userName || 'there'} 👋
        </Text>
        <Text style={styles.subtitle}>
          Ready for your practice today?
        </Text>
      </View>

      <View style={styles.content}>
        {/* Available Classes Card */}
        <View style={styles.availableCard}>
          <View style={styles.availableContent}>
            <Text style={styles.availableTitle}>Available Classes</Text>
            <View style={styles.availableNumber}>
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : hasUnlimitedPass ? (
                <>
                  <Text style={styles.numberText}>∞</Text>
                  <Infinity size={24} color="white" />
                </>
              ) : (
                <>
                  <Text style={styles.numberText}>{credits}</Text>
                  <Flame size={24} color="white" />
                </>
              )}
            </View>
          </View>
        </View>

        {/* Next Booked Class */}
        <View style={styles.nextClassCard}>
          <View style={styles.nextClassHeader}>
            <Text style={styles.nextClassTitle}>Next Booked Class</Text>
            <Clock size={16} color="#666" />
          </View>
          {nextClass ? (
            <>
              <Text style={styles.className}>{nextClass.name}</Text>
              <Text style={styles.classDetails}>
                {formatTime(nextClass.time)} • {nextClass.instructor}
              </Text>
              <Text style={styles.classLevel}>
                {nextClass.level} • {nextClass.temperature}
              </Text>
              <Text style={styles.classDate}>
                {new Date(nextClass.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
              <TouchableOpacity 
                style={[styles.unbookButton, unbooking && styles.unbookButtonDisabled]}
                onPress={() => handleUnbookClass(nextClass.id)}
                disabled={unbooking}
              >
                <Text style={styles.unbookButtonText}>
                  {unbooking ? 'Cancelling...' : 'Cancel Class'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.className}>No upcoming classes</Text>
              <Text style={styles.classDetails}>
                Book a class to see it here
              </Text>
            </>
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/schedule')}>
            <View style={styles.actionIcon}>
              <Calendar size={24} color="#FF6B35" />
              <Plus size={12} color="#FF6B35" style={styles.plusIcon} />
            </View>
            <Text style={styles.actionText}>Book Class</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/passes')}>
            <View style={styles.actionIcon}>
              <CreditCard size={24} color="#FF6B35" />
              <Plus size={12} color="#FF6B35" style={styles.plusIcon} />
            </View>
            <Text style={styles.actionText}>Buy Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/schedule')}>
            <View style={styles.actionIcon}>
              <Calendar size={24} color="#FF6B35" />
              <Clock size={12} color="#FF6B35" style={styles.clockIcon} />
            </View>
            <Text style={styles.actionText}>View Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/profile')}>
            <View style={styles.actionIcon}>
              <User size={24} color="#FF6B35" />
              <Settings size={12} color="#FF6B35" style={styles.settingsIcon} />
            </View>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Classes */}
        <Text style={styles.sectionTitle}>Today's Classes</Text>
        {todaysClasses.length === 0 ? (
          <View style={styles.emptyClassesCard}>
            <Text style={styles.emptyClassesText}>No classes scheduled for today</Text>
            <Text style={styles.emptyClassesSubtext}>Check tomorrow's schedule</Text>
          </View>
        ) : (
          todaysClasses.map((classItem, index) => (
            <View key={index} style={styles.classCard}>
              <View style={styles.classTime}>
                <Text style={styles.timeText}>{formatTime(classItem.time)}</Text>
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{classItem.name}</Text>
                <Text style={styles.instructorText}>{classItem.instructor}</Text>
              </View>
              <View style={styles.spotsContainer}>
                <Text style={[
                  styles.spotsText,
                  classItem.spots === 0 && styles.fullyBooked
                ]}>
                  {classItem.spots === 0 ? 'Fully booked' : `${classItem.spots} spots left`}
                </Text>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.viewScheduleButton} onPress={() => router.push('/(tabs)/schedule')}>
          <Text style={styles.viewScheduleText}>View Full Schedule</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
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
    padding: 20,
  },
  availableCard: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  availableContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  availableNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numberText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  nextClassCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextClassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextClassTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  classLevel: {
    fontSize: 12,
    color: '#999',
  },
  classDate: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
    marginTop: 4,
  },
  emptyClassesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyClassesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptyClassesSubtext: {
    fontSize: 14,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    position: 'relative',
    marginBottom: 8,
  },
  plusIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  clockIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  settingsIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  classCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  classTime: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  classInfo: {
    flex: 1,
  },
  instructorText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  spotsContainer: {
    alignItems: 'flex-end',
  },
  spotsText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  fullyBooked: {
    color: '#dc3545',
  },
  viewScheduleButton: {
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  viewScheduleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  unbookButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  unbookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  unbookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});