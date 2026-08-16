/**
 * Root Navigator - Salifz
 * ✅ FIXED: Added PrayerTimes, Qibla, Khatam, KhatamDetail screens
 * ✅ FIXED: All screens from main/ folder are now registered
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';

import { useGamificationStore } from '../stores';
import { COLORS } from '../config';
import { isAuthenticated } from '../services/api';

// ============ AUTH SCREENS ============
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import GoalSetupScreen from '../screens/settings/GoalSetupScreen';

// ============ VERIFICATION SCREENS ============
import PhoneVerificationScreen from '../screens/verification/PhoneVerificationScreen';
import EmailVerificationScreen from '../screens/verification/EmailVerificationScreen';
import BiometricVerificationScreen from '../screens/verification/BiometricVerificationScreen';

// ============ MAIN SCREENS ============
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import PrayerTimesScreen from '../screens/main/PrayerTimesScreen';  // ✅ ADDED
import QiblaScreen from '../screens/main/QiblaScreen';              // ✅ ADDED
import KhatamScreen from '../screens/main/KhatamScreen';            // ✅ ADDED
import KhatamDetailScreen from '../screens/main/KhatamDetailScreen'; // ✅ ADDED

// ============ QURAN SCREENS ============
import LessonsScreen from '../screens/quran/LessonsScreen';
import LessonDetailScreen from '../screens/quran/LessonDetailScreen';
import LessonCompleteScreen from '../screens/quran/LessonCompleteScreen';
import ReviewScreen from '../screens/quran/ReviewScreen';
import MushafScreen from '../screens/quran/MushafScreen';
import DownloadsScreen from '../screens/quran/DownloadsScreen';
import SubmitRecitationScreen from '../screens/social/SubmitRecitationScreen';
import TeacherReviewScreen from '../screens/social/TeacherReviewScreen';
import AudioPlayerScreen from '../screens/quran/AudioPlayerScreen';
import DailyVerseScreen from '../screens/quran/DailyVerseScreen';

// ============ GAMIFICATION SCREENS ============
import ChallengesScreen from '../screens/gamification/ChallengesScreen';
import StreakScreen from '../screens/gamification/StreakScreen';
import LeaderboardScreen from '../screens/gamification/LeaderboardScreen';
import ShopScreen from '../screens/gamification/ShopScreen';
import AchievementsScreen from '../screens/gamification/AchievementsScreen';
import InsightsScreen from '../screens/gamification/InsightsScreen';

// ============ SOCIAL SCREENS ============
import FriendsScreen from '../screens/social/FriendsScreen';
import HalaqaScreen from '../screens/social/HalaqaScreen';
import HalaqaDetailScreen from '../screens/social/HalaqaDetailScreen';
import HalaqaChatScreen from '../screens/social/HalaqaChatScreen';
import UserProfileScreen from '../screens/social/UserProfileScreen';
import SocialHubScreen from '../screens/social/SocialHubScreen';

// ============ CHAT SCREENS ============
import ChatScreen from '../screens/chat/ChatScreen';
import ChatVideoScreen from '../screens/chat/ChatVideoScreen';
import ChatAudioScreen from '../screens/chat/ChatAudioScreen';
import ConversationsListScreen from '../screens/chat/ConversationsListScreen';

// ============ SETTINGS SCREENS ============
import SettingsScreen from '../screens/settings/SettingsScreen';
import SubscriptionsScreen from '../screens/settings/SubscriptionsScreen';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme, ThemeColors, fixedColors } from '../contexts/ThemeContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================
// MAIN TABS
// ============================================

function MainTabs() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const { streak } = useGamificationStore();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadUnreadCount = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!isMounted) return;
        
        if (!isAuthenticated()) {
          console.log('[MainTabs] Not authenticated, skipping unread count');
          return;
        }

        try {
          console.log('[MainTabs] Loading unread count...');
          const { chatAPI } = require('../services/api');
          const response = await chatAPI.getConversations();
          
          if (!isMounted) return;
          
          const convos = response?.data || response || [];
          const count = Array.isArray(convos) 
            ? convos.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0) 
            : 0;
          
          setUnreadMessages(count);
        } catch (error: any) {
          console.log('[MainTabs] Could not load unread count:', error?.error || error?.message);
        }
      };

      loadUnreadCount();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.backgroundAlt,
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'الرئيسية',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="LessonsTab"
        component={LessonsScreen}
        options={{
          tabBarLabel: 'الدروس',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📖</Text>
          ),
        }}
      />
      <Tab.Screen
        name="SocialTab"
        component={SocialHubScreen}
        options={{
          tabBarLabel: 'التواصل',
          tabBarIcon: ({ focused }) => (
            <View style={styles.socialTabIcon}>
              <Text style={{ fontSize: 22 }}>💬</Text>
              {unreadMessages > 0 && (
                <View style={[styles.messageBadge, focused && styles.messageBadgeActive]}>
                  <Text style={styles.messageBadgeText}>
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="StreakTab"
        component={StreakScreen}
        options={{
          tabBarLabel: 'السلسلة',
          tabBarIcon: ({ focused }) => (
            <View style={styles.streakTabIcon}>
              <Text style={{ fontSize: 22 }}>🔥</Text>
              <View style={[styles.streakBadge, focused && styles.streakBadgeActive]}>
                <Text style={styles.streakBadgeText}>{streak}</Text>
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'حسابي',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ============================================
// ROOT NAVIGATOR
// ============================================

export default function RootNavigator() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName="Splash"
      >
        {/* ============ AUTH FLOW ============ */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="GoalSetup" component={GoalSetupScreen} />
        <Stack.Screen name="Mushaf" component={MushafScreen} />
        <Stack.Screen name="Downloads" component={DownloadsScreen} />
        <Stack.Screen name="SubmitRecitation" component={SubmitRecitationScreen} />
        <Stack.Screen name="TeacherReview" component={TeacherReviewScreen} />
        
        {/* ============ VERIFICATION ============ */}
        <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="BiometricVerification" component={BiometricVerificationScreen} />
        
        {/* ============ MAIN APP ============ */}
        <Stack.Screen name="Main" component={MainTabs} />
        
        {/* ============ MAIN SCREENS (✅ ADDED) ============ */}
        <Stack.Screen name="PrayerTimes" component={PrayerTimesScreen} />
        <Stack.Screen name="Qibla" component={QiblaScreen} />
        <Stack.Screen name="Khatam" component={KhatamScreen} />
        <Stack.Screen name="KhatamDetail" component={KhatamDetailScreen} />
        
        {/* ============ QURAN ============ */}
        <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
        <Stack.Screen name="LessonComplete" component={LessonCompleteScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} />
        <Stack.Screen name="DailyVerse" component={DailyVerseScreen} />
        
        {/* ============ GAMIFICATION ============ */}
        <Stack.Screen name="Challenges" component={ChallengesScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="Shop" component={ShopScreen} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />
        <Stack.Screen name="Insights" component={InsightsScreen} />
        
        {/* ============ SOCIAL ============ */}
        <Stack.Screen name="Friends" component={FriendsScreen} />
        <Stack.Screen name="Halaqa" component={HalaqaScreen} />
        <Stack.Screen name="HalaqaDetail" component={HalaqaDetailScreen} />
        <Stack.Screen name="HalaqaChat" component={HalaqaChatScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        
        {/* ============ CHAT ============ */}
        <Stack.Screen name="ConversationsList" component={ConversationsListScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ChatVideo" component={ChatVideoScreen} />
        <Stack.Screen name="ChatAudio" component={ChatAudioScreen} />
        
        {/* ============ SETTINGS ============ */}
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ============================================
// STYLES
// ============================================

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  streakTabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBadge: {
    position: 'absolute',
    top: -5,
    right: -12,
    backgroundColor: fixedColors.streak,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  streakBadgeActive: {
    backgroundColor: c.primary,
  },
  streakBadgeText: {
    color: c.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  socialTabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadge: {
    position: 'absolute',
    top: -5,
    right: -12,
    backgroundColor: c.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  messageBadgeActive: {
    backgroundColor: c.primary,
  },
  messageBadgeText: {
    color: c.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
});