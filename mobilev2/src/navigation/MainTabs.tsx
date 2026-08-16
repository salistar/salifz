/**
 * Main Tabs Navigation - Salifz
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import LessonsScreen from '../screens/quran/LessonsScreen';
import LeaderboardScreen from '../screens/gamification/LeaderboardScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  badge?: number;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focused, color, badge }) => {
  const styles = useThemedStyles(makeStyles);

  return (
  <View style={styles.iconContainer}>
    <Ionicons name={name} size={24} color={color} />
    {badge && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
      </View>
    )}
  </View>
  );
};

export const MainTabs: React.FC = () => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Lessons"
        component={LessonsScreen}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'book' : 'book-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarLabel: 'Ranks',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'trophy' : 'trophy-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  tabBar: {
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.backgroundAlt,
    paddingTop: 8,
    paddingBottom: 8,
    height: 60,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: c.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: c.surface,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default MainTabs;
