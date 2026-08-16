/**
 * Splash Screen - Salifz
 * ✅ FIXED: Token initialization before auth check
 * ✅ FIXED: Proper navigation flow
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

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }: any) {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);

  useEffect(() => {
    startAnimations();
    initializeApp();
    
    // Cleanup
    return () => {
      hasNavigated.current = true;
    };
  }, []);

  const startAnimations = () => {
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
    ]).start();

    // App name animation
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(textOpacity, { 
        toValue: 1, 
        duration: 600, 
        useNativeDriver: true 
      })
    ]).start();

    // Subtitle animation
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(subtitleOpacity, { 
        toValue: 1, 
        duration: 600, 
        useNativeDriver: true 
      })
    ]).start();

    // Progress bar animation
    Animated.timing(progressWidth, { 
      toValue: 100, 
      duration: 2500, 
      useNativeDriver: false 
    }).start();
  };

  const initializeApp = async () => {
    let navigateTo = 'Onboarding';
    
    try {
      console.log('[SPLASH] Initializing app...');
      
      // ✅ Step 1: Initialize token from storage FIRST
      const hasToken = await initializeToken();
      console.log('[SPLASH] Token initialized:', hasToken);
      
      // ✅ Step 2: Check if onboarding was completed
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      const onboardingCompletedAlt = await AsyncStorage.getItem('onboardingCompleted');
      const isOnboardingDone = onboardingCompleted === 'true' || onboardingCompletedAlt === 'true';
      
      console.log('[SPLASH] Onboarding completed:', isOnboardingDone);
      
      // ✅ Step 3: If we have a token, try to load user
      if (hasToken) {
        try {
          const { checkAuth } = useAuthStore.getState();
          const isAuthenticated = await checkAuth();
          
          console.log('[SPLASH] Auth check result:', isAuthenticated);
          
          if (isAuthenticated) {
            navigateTo = 'Main';
            // ✅ NOTE: Socket will be initialized in authStore.checkAuth()
          } else {
            // Token invalid or expired
            navigateTo = isOnboardingDone ? 'Login' : 'Onboarding';
          }
        } catch (authError) {
          console.log('[SPLASH] Auth check error:', authError);
          navigateTo = isOnboardingDone ? 'Login' : 'Onboarding';
        }
      } else {
        // No token
        navigateTo = isOnboardingDone ? 'Login' : 'Onboarding';
      }
      
      console.log('[SPLASH] Will navigate to:', navigateTo);
      
    } catch (error) {
      console.log('[SPLASH] Init error:', error);
      navigateTo = 'Onboarding';
    }
    
    // ✅ Navigate after animation completes (2.5 seconds)
    setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;
      
      try {
        console.log('[SPLASH] Navigating to:', navigateTo);
        navigation.replace(navigateTo);
      } catch (e) {
        console.log('[SPLASH] Navigation error:', e);
        // Fallback navigation
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: navigateTo }],
          });
        } catch (e2) {
          console.log('[SPLASH] Fallback navigation error:', e2);
        }
      }
    }, 2500);
  };

  return (
    <LinearGradient 
      colors={['#1a1a2e', '#16213e', '#0f3460']} 
      style={styles.container}
    >
      {/* Background decorations */}
      <View style={styles.bgDecor1} />
      <View style={styles.bgDecor2} />
      <View style={styles.bgDecor3} />
      
      {/* Bismillah */}
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
      <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
        {'Salifz'}
      </Animated.Text>
      
      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        {'احفظ القرآن بطريقة ممتعة'}
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
        <Text style={styles.loadingText}>{'جاري التحميل...'}</Text>
      </View>

      {/* Features hint */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>{'🎮'}</Text>
          <Text style={styles.featureText}>{'تعلم بالألعاب'}</Text>
        </View>
        <View style={styles.featureDivider} />
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>{'🏆'}</Text>
          <Text style={styles.featureText}>{'تنافس مع الأصدقاء'}</Text>
        </View>
        <View style={styles.featureDivider} />
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>{'📊'}</Text>
          <Text style={styles.featureText}>{'تابع تقدمك'}</Text>
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