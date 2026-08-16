/**
 * ============================================
 * 📱 SplashScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ FIXED: Token initialization before auth check
 * ✅ FIXED: Proper navigation flow
 * ✅ ENHANCED: More detailed console.log
 * ✅ NOTE: Socket is initialized in authStore after successful auth
 */

import React, { useEffect, useRef } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../stores';
import { initializeToken } from '../../services/api';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

const { width, height } = Dimensions.get('window');

// ✅ Constante pour les logs
const LOG_PREFIX = '[SplashScreen.tsx]';

export default function SplashScreen({ navigation }: any) {
  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log(`${LOG_PREFIX} 📌 useEffect triggered`);
    console.log(`${LOG_PREFIX} 📐 Screen dimensions: ${width}x${height}`);
    
    startAnimations();
    initializeApp();
    
    // Cleanup
    return () => {
      console.log(`${LOG_PREFIX} 🧹 Component unmounting, cleanup...`);
      hasNavigated.current = true;
    };
  }, []);

  const startAnimations = () => {
    console.log(`${LOG_PREFIX} 🎬 Starting animations...`);
    
    // Logo animation
    Animated.parallel([
      Animated.spring(logoScale, { 
        toValue: 1, 
        tension: 50, 
        friction: 7, 
        useNativeDriver: true 
      }),
      Animated.timing(logoOpacity, { 
        toValue: 1, 
        duration: 800, 
        useNativeDriver: true 
      })
    ]).start(() => {
      console.log(`${LOG_PREFIX} ✅ Logo animation complete`);
    });

    // App name animation
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(textOpacity, { 
        toValue: 1, 
        duration: 600, 
        useNativeDriver: true 
      })
    ]).start(() => {
      console.log(`${LOG_PREFIX} ✅ App name animation complete`);
    });

    // Subtitle animation
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(subtitleOpacity, { 
        toValue: 1, 
        duration: 600, 
        useNativeDriver: true 
      })
    ]).start(() => {
      console.log(`${LOG_PREFIX} ✅ Subtitle animation complete`);
    });

    // Progress bar animation
    Animated.timing(progressWidth, { 
      toValue: 100, 
      duration: 2500, 
      useNativeDriver: false 
    }).start(() => {
      console.log(`${LOG_PREFIX} ✅ Progress bar animation complete (2.5s)`);
    });
  };

  const initializeApp = async () => {
    console.log(`${LOG_PREFIX} 🔄 ========== INITIALIZATION START ==========`);
    
    let navigateTo = 'Onboarding';
    
    try {
      console.log(`${LOG_PREFIX} 📱 Initializing app...`);
      
      // ✅ Step 1: Initialize token from storage FIRST
      console.log(`${LOG_PREFIX} 🔑 Step 1: Initializing token from storage...`);
      const hasToken = await initializeToken();
      console.log(`${LOG_PREFIX} 🔑 Token initialized: ${hasToken}`);
      
      // ✅ Step 2: Check if onboarding was completed
      console.log(`${LOG_PREFIX} 📋 Step 2: Checking onboarding status...`);
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      const onboardingCompletedAlt = await AsyncStorage.getItem('onboardingCompleted');
      const isOnboardingDone = onboardingCompleted === 'true' || onboardingCompletedAlt === 'true';
      
      console.log(`${LOG_PREFIX} 📋 Onboarding completed: ${isOnboardingDone}`);
      console.log(`${LOG_PREFIX} 📋 - onboarding_completed: ${onboardingCompleted}`);
      console.log(`${LOG_PREFIX} 📋 - onboardingCompleted: ${onboardingCompletedAlt}`);
      
      // ✅ Step 3: If we have a token, try to load user
      if (hasToken) {
        console.log(`${LOG_PREFIX} 👤 Step 3: Token exists, checking auth...`);
        try {
          const { checkAuth } = useAuthStore.getState();
          console.log(`${LOG_PREFIX} 👤 Calling checkAuth()...`);
          const isAuthenticated = await checkAuth();
          
          console.log(`${LOG_PREFIX} 👤 Auth check result: ${isAuthenticated}`);
          
          if (isAuthenticated) {
            console.log(`${LOG_PREFIX} ✅ User authenticated! Navigating to Main`);
            navigateTo = 'Main';
            // ✅ NOTE: Socket will be initialized in authStore.checkAuth()
          } else {
            console.log(`${LOG_PREFIX} ❌ Token invalid or expired`);
            navigateTo = isOnboardingDone ? 'Login' : 'Onboarding';
          }
        } catch (authError) {
          console.log(`${LOG_PREFIX} ❌ Auth check error:`, authError);
          navigateTo = isOnboardingDone ? 'Login' : 'Onboarding';
        }
      } else {
        console.log(`${LOG_PREFIX} 🔓 No token found`);
        navigateTo = isOnboardingDone ? 'Login' : 'Onboarding';
      }
      
      console.log(`${LOG_PREFIX} 🎯 Final destination: ${navigateTo}`);
      
    } catch (error) {
      console.log(`${LOG_PREFIX} ❌ Init error:`, error);
      navigateTo = 'Onboarding';
    }
    
    console.log(`${LOG_PREFIX} ⏱️ Waiting 2.5s for animations to complete...`);
    
    // ✅ Navigate after animation completes (2.5 seconds)
    setTimeout(() => {
      console.log(`${LOG_PREFIX} ⏱️ Timeout completed`);
      
      if (hasNavigated.current) {
        console.log(`${LOG_PREFIX} ⚠️ Already navigated, skipping...`);
        return;
      }
      hasNavigated.current = true;
      
      try {
        console.log(`${LOG_PREFIX} 🚀 Navigating to: ${navigateTo}`);
        navigation.replace(navigateTo);
        console.log(`${LOG_PREFIX} ✅ Navigation successful`);
      } catch (e) {
        console.log(`${LOG_PREFIX} ❌ Navigation error:`, e);
        // Fallback navigation
        try {
          console.log(`${LOG_PREFIX} 🔄 Trying fallback navigation (reset)...`);
          navigation.reset({
            index: 0,
            routes: [{ name: navigateTo }],
          });
          console.log(`${LOG_PREFIX} ✅ Fallback navigation successful`);
        } catch (e2) {
          console.log(`${LOG_PREFIX} ❌ Fallback navigation error:`, e2);
        }
      }
      
      console.log(`${LOG_PREFIX} 🔄 ========== INITIALIZATION END ==========`);
    }, 2500);
  };

  console.log(`${LOG_PREFIX} 🎨 Rendering UI...`);

  return (
    <LinearGradient 
      colors={['#1a1a2e', '#16213e', '#0f3460']} 
      style={styles.container}
    >
      {/* Background decorations */}
      <View style={styles.bgDecor1} />
      <View style={styles.bgDecor2} />
      <View style={styles.bgDecor3} />
      
      {/* Bismillah - On garde le symbole arabe car c'est décoratif */}
      <View style={styles.decorContainer}>
        <Text style={styles.decorText}>{'﷽'}</Text>
      </View>
      
      {/* Logo */}
      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            transform: [{ scale: logoScale }], 
            opacity: logoOpacity 
          }
        ]}
      >
        <LinearGradient 
          colors={[COLORS.primary, '#2E7D32']} 
          style={styles.logoGradient}
        >
          <Text style={styles.logoEmoji}>{'📖'}</Text>
        </LinearGradient>
        
        {/* Glow effect */}
        <View style={styles.logoGlow} />
      </Animated.View>

      {/* App Name */}
      {/* ✅ AVANT: {'Salifz'} */}
      {/* ✅ APRÈS: */}
      <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
        {t('common.appName')}
      </Animated.Text>
      
      {/* Subtitle */}
      {/* ✅ AVANT: {'احفظ القرآن بطريقة ممتعة'} */}
      {/* ✅ APRÈS: */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        {t('onboarding.slogan')}
      </Animated.Text>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: progressWidth.interpolate({ 
                  inputRange: [0, 100], 
                  outputRange: ['0%', '100%'] 
                }) 
              }
            ]} 
          />
        </View>
        {/* ✅ AVANT: {'جاري التحميل...'} */}
        {/* ✅ APRÈS: */}
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>

      {/* Features hint */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>{'🎮'}</Text>
          {/* ✅ AVANT: {'تعلم بالألعاب'} */}
          {/* ✅ APRÈS: */}
          <Text style={styles.featureText}>{t('splash.learnWithGames')}</Text>
        </View>
        <View style={styles.featureDivider} />
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>{'🏆'}</Text>
          {/* ✅ AVANT: {'تنافس مع الأصدقاء'} */}
          {/* ✅ APRÈS: */}
          <Text style={styles.featureText}>{t('splash.competeWithFriends')}</Text>
        </View>
        <View style={styles.featureDivider} />
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>{'📊'}</Text>
          {/* ✅ AVANT: {'تابع تقدمك'} */}
          {/* ✅ APRÈS: */}
          <Text style={styles.featureText}>{t('splash.trackProgress')}</Text>
        </View>
      </View>

      {/* Version */}
      <Text style={styles.version}>{'v3.0.0'}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  // Background decorations
  bgDecor1: { 
    position: 'absolute', 
    width: 300, 
    height: 300, 
    borderRadius: 150, 
    backgroundColor: 'rgba(76, 175, 80, 0.05)', 
    top: -100, 
    right: -100 
  },
  bgDecor2: { 
    position: 'absolute', 
    width: 200, 
    height: 200, 
    borderRadius: 100, 
    backgroundColor: 'rgba(76, 175, 80, 0.05)', 
    bottom: -50, 
    left: -50 
  },
  bgDecor3: { 
    position: 'absolute', 
    width: 150, 
    height: 150, 
    borderRadius: 75, 
    backgroundColor: 'rgba(76, 175, 80, 0.03)', 
    top: height * 0.3, 
    left: -75 
  },
  
  // Bismillah decoration
  decorContainer: { 
    position: 'absolute', 
    top: 80 
  },
  decorText: { 
    fontSize: 32, 
    color: 'rgba(76, 175, 80, 0.3)' 
  },
  
  // Logo
  logoContainer: { 
    marginBottom: 30,
    position: 'relative',
  },
  logoGradient: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  logoEmoji: { 
    fontSize: 70 
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    top: -10,
    left: -10,
  },
  
  // App name
  appName: { 
    fontSize: 42, 
    fontWeight: 'bold', 
    color: '#fff', 
    letterSpacing: 2,
    textShadowColor: 'rgba(76, 175, 80, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  
  // Subtitle
  subtitle: { 
    fontSize: 18, 
    color: '#aaa', 
    marginTop: 10 
  },
  
  // Progress
  progressContainer: { 
    position: 'absolute', 
    bottom: 160, 
    alignItems: 'center' 
  },
  progressBar: { 
    width: 200, 
    height: 4, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 2, 
    overflow: 'hidden' 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: COLORS.primary, 
    borderRadius: 2 
  },
  loadingText: { 
    color: '#666', 
    marginTop: 15, 
    fontSize: 14 
  },
  
  // Features
  featuresContainer: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  featureIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 10,
    color: '#666',
  },
  featureDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  // Version
  version: { 
    position: 'absolute', 
    bottom: 30, 
    color: '#444', 
    fontSize: 12 
  },
});