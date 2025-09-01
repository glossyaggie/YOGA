import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="schedule" 
        options={{ 
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="passes" 
        options={{ 
          title: 'Passes',
          tabBarIcon: ({ color, size }) => <Ionicons name="card-outline" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="stats" 
        options={{ 
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />
        }} 
      />
    </Tabs>
  );
}