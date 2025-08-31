import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Calendar, Clock, Users, Flame } from 'lucide-react-native';

const mockClasses = [
  {
    id: 1,
    name: 'Hot Vinyasa Flow',
    instructor: 'Sarah Johnson',
    time: '6:00 AM',
    duration: 60,
    temperature: 95,
    spotsAvailable: 8,
    totalSpots: 20,
    level: 'All Levels',
  },
  {
    id: 2,
    name: 'Bikram 26 & 2',
    instructor: 'Mike Chen',
    time: '7:30 AM',
    duration: 90,
    temperature: 105,
    spotsAvailable: 12,
    totalSpots: 25,
    level: 'Beginner',
  },
  {
    id: 3,
    name: 'Power Yoga',
    instructor: 'Emma Wilson',
    time: '9:00 AM',
    duration: 75,
    temperature: 90,
    spotsAvailable: 3,
    totalSpots: 15,
    level: 'Intermediate',
  },
  {
    id: 4,
    name: 'Yin Yoga',
    instructor: 'David Park',
    time: '6:00 PM',
    duration: 60,
    temperature: 85,
    spotsAvailable: 15,
    totalSpots: 20,
    level: 'All Levels',
  },
  {
    id: 5,
    name: 'Hot Flow',
    instructor: 'Lisa Martinez',
    time: '7:30 PM',
    duration: 60,
    temperature: 95,
    spotsAvailable: 0,
    totalSpots: 18,
    level: 'Advanced',
  },
];

const days = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ScheduleScreen() {
  const [selectedDay, setSelectedDay] = useState(0);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Class Schedule</Text>
        <Text style={styles.subtitle}>Book your next session</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {days.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              selectedDay === index && styles.selectedDayButton,
            ]}
            onPress={() => setSelectedDay(index)}
          >
            <Text
              style={[
                styles.dayText,
                selectedDay === index && styles.selectedDayText,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        style={styles.classList} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.classListContent}
      >
        {mockClasses.map((classItem) => (
          <TouchableOpacity key={classItem.id} style={styles.classCard}>
            <View style={styles.classHeader}>
              <View style={styles.classMainInfo}>
                <Text style={styles.className}>{classItem.name}</Text>
                <Text style={styles.instructor}>with {classItem.instructor}</Text>
              </View>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: getLevelColor(classItem.level) },
                ]}
              >
                <Text style={styles.levelText}>{classItem.level}</Text>
              </View>
            </View>

            <View style={styles.classDetails}>
              <View style={styles.detailItem}>
                <Clock size={16} color="#666" />
                <Text style={styles.detailText}>
                  {classItem.time} • {classItem.duration}min
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Flame size={16} color="#FF6B35" />
                <Text style={styles.detailText}>{classItem.temperature}°F</Text>
              </View>
              <View style={styles.detailItem}>
                <Users size={16} color="#666" />
                <Text style={styles.detailText}>
                  {classItem.spotsAvailable}/{classItem.totalSpots} spots
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.bookButton,
                classItem.spotsAvailable === 0 && styles.fullButton,
              ]}
              disabled={classItem.spotsAvailable === 0}
            >
              <Text
                style={[
                  styles.bookButtonText,
                  classItem.spotsAvailable === 0 && styles.fullButtonText,
                ]}
              >
                {classItem.spotsAvailable === 0 ? 'Class Full' : 'Book Class'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
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
  daySelector: {
    backgroundColor: 'white',
  },
  daySelectorContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  dayButton: {
    width: 50,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayButton: {
    backgroundColor: '#FF6B35',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  selectedDayText: {
    color: 'white',
  },
  classList: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  classListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  classCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  classMainInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  instructor: {
    fontSize: 13,
    color: '#666',
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  levelText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'white',
  },
  classDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailText: {
    fontSize: 11,
    color: '#666',
  },
  bookButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  fullButton: {
    backgroundColor: '#f5f5f5',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fullButtonText: {
    color: '#999',
  },
});