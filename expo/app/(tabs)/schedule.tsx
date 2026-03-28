import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Calendar, Clock, Users, Thermometer, User } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { Class } from '../../src/types/database';
import { bookClass, getUserBookings } from '../../src/lib/api';
import { useAuth } from '../../providers/auth-provider';
import colors from '../../constants/colors';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ScheduleScreen() {
  const { user } = useAuth();
  // Convert JavaScript day (0=Sunday, 1=Monday) to our Monday-first array (0=Monday, 6=Sunday)
  const getCurrentDayIndex = () => {
    const jsDay = new Date().getDay(); // 0=Sunday, 1=Monday, etc.
    return jsDay === 0 ? 6 : jsDay - 1; // Convert to Monday-first: Sunday becomes 6, Monday becomes 0
  };
  
  const [selectedDay, setSelectedDay] = useState(getCurrentDayIndex());
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [booking, setBooking] = useState<number | null>(null);
  const [bookedClasses, setBookedClasses] = useState<Set<number>>(new Set()); // Temporary green flash
  const [actuallyBookedClasses, setActuallyBookedClasses] = useState<Set<number>>(new Set()); // Permanent green

  const fetchUserBookings = async () => {
    if (!user) return;
    
    try {
      const bookings = await getUserBookings();
      const selectedDate = getSelectedDate();
      
      // Find bookings for the selected date and get class IDs
      const bookedClassIds = bookings
        .filter(booking => booking.booking_date === selectedDate)
        .map(booking => booking.class_id)
        .filter(id => id !== null);
      
      setActuallyBookedClasses(new Set(bookedClassIds));
    } catch (error) {
      console.error('Error fetching user bookings:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      // Reset temporary booked classes visual state when fetching new data
      setBookedClasses(new Set());
      
      // Convert our Monday-first day index back to JavaScript day format for database
      const jsDay = selectedDay === 6 ? 0 : selectedDay + 1; // 6 (Sunday) becomes 0, others add 1
      
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('day_of_week', jsDay)
        .eq('is_active', true)
        .order('start_time');

      if (error) {
        console.error('Error fetching classes:', error);
        Alert.alert('Error', 'Failed to load schedule');
        return;
      }

      // Filter out classes that have already started today
      const now = new Date();
      const currentTime = now.toTimeString().substring(0, 5); // Format: HH:MM
      const isToday = getCurrentDayIndex() === selectedDay;
      
      const filteredClasses = (data || []).filter(classData => {
        if (!isToday) return true; // Show all classes for future days
        return classData.start_time > currentTime; // Only show classes that haven't started yet
      });

      console.log('Fetched classes:', filteredClasses);
      setClasses(filteredClasses);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchClasses();
      fetchUserBookings();
    }, [selectedDay, user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchClasses(), fetchUserBookings()]);
    setRefreshing(false);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return '#4CAF50';
      case 'Intermediate':
        return '#FF9800';
      case 'Advanced':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  const getTemperatureColor = (temp: number | null) => {
    if (!temp) return '#9E9E9E';
    if (temp >= 38) return '#F44336'; // Hot
    if (temp >= 32) return '#FF9800'; // Warm
    return '#4CAF50'; // Room temp
  };

  const getSelectedDate = () => {
    const today = new Date();
    const currentDayIndex = getCurrentDayIndex();
    const dayDiff = selectedDay - currentDayIndex;
    const targetDate = new Date(today.getTime() + dayDiff * 24 * 60 * 60 * 1000);
    return targetDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };

  const handleBookClass = async (classId: number) => {
    try {
      setBooking(classId);
      const selectedDate = getSelectedDate();
      await bookClass(classId, selectedDate);
      
      // Add haptic feedback - strong success vibration
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Add visual feedback - mark class as booked
      setBookedClasses(prev => new Set(prev).add(classId));
      
      // Show success alert
      Alert.alert('🎉 Success!', 'Class booked successfully!');
      
      // Refresh the data after a short delay to show the green effect
      setTimeout(async () => {
        await Promise.all([fetchClasses(), fetchUserBookings()]);
      }, 1500);
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to book class';
      
      // Add haptic feedback - error vibration
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert('Booking Error', errorMessage);
    } finally {
      setBooking(null);
    }
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getDayDate = (dayIndex: number) => {
    const today = new Date();
    const currentDayIndex = getCurrentDayIndex();
    const dayDiff = dayIndex - currentDayIndex;
    const targetDate = new Date(today.getTime() + dayDiff * 24 * 60 * 60 * 1000);
    const day = targetDate.getDate();
    return `${day}${getOrdinalSuffix(day)}`;
  };

  const renderDayButton = (dayIndex: number) => {
    const isSelected = selectedDay === dayIndex;
    const isToday = getCurrentDayIndex() === dayIndex;
    const dayDate = getDayDate(dayIndex);
    
    return (
      <TouchableOpacity
        key={dayIndex}
        style={[
          styles.dayButton,
          isSelected && styles.dayButtonSelected,
          isToday && !isSelected && styles.dayButtonToday
        ]}
        onPress={() => setSelectedDay(dayIndex)}
      >
        <Text style={[
          styles.dayButtonText,
          isSelected && styles.dayButtonTextSelected,
          isToday && !isSelected && styles.dayButtonTextToday
        ]}>
          {DAYS_SHORT[dayIndex]}
        </Text>
        <Text style={[
          styles.dayDateText,
          isSelected && styles.dayDateTextSelected,
          isToday && !isSelected && styles.dayDateTextToday
        ]}>
          {dayDate}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderClassCard = (classData: any) => {
    const spotsLeft = classData.max_capacity - (classData.current_bookings || 0);
    const isFull = spotsLeft <= 0;
    const isBooking = booking === classData.id;
    const isJustBooked = bookedClasses.has(classData.id); // Temporary green flash
    const isActuallyBooked = actuallyBookedClasses.has(classData.id); // Permanent green
    const isBooked = isJustBooked || isActuallyBooked;

    return (
      <View key={classData.id} style={[
        styles.classCard,
        isBooked && styles.classCardBooked
      ]}>
        <View style={styles.classHeader}>
          <View style={styles.classInfo}>
            <Text style={styles.className}>{classData.class_name || 'Class'}</Text>
            <Text style={styles.classDescription} numberOfLines={2}>
              {classData.description || 'Join us for an amazing yoga experience'}
            </Text>
          </View>
          <View style={[
            styles.levelBadge,
            { backgroundColor: getLevelColor(classData.level || 'All Levels') }
          ]}>
            <Text style={styles.levelText}>{classData.level || 'All Levels'}</Text>
          </View>
        </View>

        <View style={styles.classDetails}>
          <View style={styles.detailRow}>
            <User size={16} color={colors.primary} />
            <Text style={styles.detailText}>{classData.instructor || 'Instructor'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={16} color={colors.primary} />
            <Text style={styles.detailText}>
              {formatTime(classData.start_time || '00:00')} - {formatTime(classData.end_time || '00:00')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Users size={16} color={colors.primary} />
            <Text style={styles.detailText}>
              Max {classData.max_capacity} students
            </Text>
          </View>

                     {classData.temperature_celsius && (
             <View style={styles.detailRow}>
               <Thermometer size={16} color={getTemperatureColor(classData.temperature_celsius)} />
               <Text style={[
                 styles.detailText,
                 { color: getTemperatureColor(classData.temperature_celsius) }
               ]}>
                 {classData.temperature_celsius}°C
               </Text>
             </View>
           )}
        </View>

        <TouchableOpacity 
          style={[
            styles.bookButton,
            isBooking && styles.bookButtonDisabled,
            isBooked && styles.bookButtonSuccess
          ]}
          onPress={() => handleBookClass(classData.id)}
          disabled={isBooking || isActuallyBooked}
        >
          {isBooking ? (
            <Text style={styles.bookButtonText}>Booking...</Text>
          ) : isActuallyBooked ? (
            <Text style={styles.bookButtonText}>✓ Booked</Text>
          ) : isJustBooked ? (
            <Text style={styles.bookButtonText}>✓ Booked!</Text>
          ) : (
            <Text style={styles.bookButtonText}>Book Class</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Class Schedule</Text>
        <Text style={styles.subtitle}>{DAYS[selectedDay]}</Text>
      </View>

      <View style={styles.daySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DAYS.map((_, index) => renderDayButton(index))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        ) : classes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={colors.gray} />
            <Text style={styles.emptyTitle}>No Classes Today</Text>
            <Text style={styles.emptyText}>
              Check another day or contact us for updates
            </Text>
          </View>
        ) : (
          <View style={styles.classesContainer}>
            {classes.map(renderClassCard)}
          </View>
        )}
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
    padding: 20,
    backgroundColor: colors.primary,
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
  daySelector: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    minWidth: 60,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
  },
  dayButtonToday: {
    backgroundColor: colors.secondary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray,
  },
  dayButtonTextSelected: {
    color: 'white',
  },
  dayButtonTextToday: {
    color: 'white',
  },
  dayDateText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.gray,
    marginTop: 2,
  },
  dayDateTextSelected: {
    color: 'white',
  },
  dayDateTextToday: {
    color: 'white',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  classesContainer: {
    padding: 20,
  },
  classCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  classCardBooked: {
    backgroundColor: '#e8f5e8',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  classInfo: {
    flex: 1,
    marginRight: 12,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  classDescription: {
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  classDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4a4a4a',
    marginLeft: 8,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
});