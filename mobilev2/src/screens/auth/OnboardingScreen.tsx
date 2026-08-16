/**
 * ============================================
 * 📱 OnboardingScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ FIXED: LinearGradient TypeScript error (colors tuple type)
 * ✅ ENHANCED: More detailed console.log
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, FlatList, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

const { width, height } = Dimensions.get('window');

// ✅ Constante pour les logs
const LOG_PREFIX = '[OnboardingScreen.tsx]';

// ✅ Type pour les couleurs du gradient (corrige l'erreur TypeScript)
type GradientColors = readonly [string, string, ...string[]];

// ✅ Interface pour les slides
interface OnboardingSlide {
  id: string;
  emoji: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  color: GradientColors;
}

// ✅ DONNÉES AVEC CLÉS i18n (au lieu de texte hardcodé)
const ONBOARDING_DATA: OnboardingSlide[] = [
  { 
    id: '1', 
    emoji: '📖', 
    titleKey: 'onboarding.slide1.title',
    subtitleKey: 'onboarding.slide1.subtitle',
    descriptionKey: 'onboarding.slide1.description',
    color: ['#4CAF50', '#2E7D32'] as const
  },
  { 
    id: '2', 
    emoji: '🎯', 
    titleKey: 'onboarding.slide2.title',
    subtitleKey: 'onboarding.slide2.subtitle',
    descriptionKey: 'onboarding.slide2.description',
    color: ['#FF9800', '#F57C00'] as const
  },
  { 
    id: '3', 
    emoji: '🔥', 
    titleKey: 'onboarding.slide3.title',
    subtitleKey: 'onboarding.slide3.subtitle',
    descriptionKey: 'onboarding.slide3.description',
    color: ['#F44336', '#D32F2F'] as const
  },
  { 
    id: '4', 
    emoji: '🏆', 
    titleKey: 'onboarding.slide4.title',
    subtitleKey: 'onboarding.slide4.subtitle',
    descriptionKey: 'onboarding.slide4.description',
    color: ['#9C27B0', '#7B1FA2'] as const
  },
  { 
    id: '5', 
    emoji: '🤖', 
    titleKey: 'onboarding.slide5.title',
    subtitleKey: 'onboarding.slide5.subtitle',
    descriptionKey: 'onboarding.slide5.description',
    color: ['#2196F3', '#1976D2'] as const
  }
];

export default function OnboardingScreen({ navigation }: any) {
  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  console.log(`${LOG_PREFIX} 📐 Screen dimensions: ${width}x${height}`);
  console.log(`${LOG_PREFIX} 📊 Total slides: ${ONBOARDING_DATA.length}`);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    console.log(`${LOG_PREFIX} ➡️ Next button pressed (current: ${currentIndex})`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      const nextIndex = currentIndex + 1;
      console.log(`${LOG_PREFIX} 📜 Scrolling to slide ${nextIndex + 1}`);
      flatListRef.current?.scrollToIndex({ index: nextIndex });
      setCurrentIndex(nextIndex);
    } else {
      console.log(`${LOG_PREFIX} 🏁 Last slide reached, completing onboarding`);
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    console.log(`${LOG_PREFIX} ⏭️ Skip button pressed`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    console.log(`${LOG_PREFIX} 🔄 ========== COMPLETING ONBOARDING ==========`);
    try {
      console.log(`${LOG_PREFIX} 💾 Saving onboarding_completed to AsyncStorage...`);
      await AsyncStorage.setItem('onboarding_completed', 'true');
      console.log(`${LOG_PREFIX} ✅ AsyncStorage saved successfully`);
      
      console.log(`${LOG_PREFIX} 🚀 Navigating to Register screen...`);
      navigation.replace('Register');
      console.log(`${LOG_PREFIX} ✅ Navigation triggered`);
    } catch (error) {
      console.log(`${LOG_PREFIX} ❌ Error completing onboarding:`, error);
    }
    console.log(`${LOG_PREFIX} 🔄 ========== ONBOARDING COMPLETE ==========`);
  };

  const renderItem = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = scrollX.interpolate({ inputRange, outputRange: [0.8, 1, 0.8], extrapolate: 'clamp' });
    const opacity = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });

    return (
      <View style={styles.slide}>
        {/* ✅ FIX: Utiliser item.color directement (déjà typé comme tuple) */}
        <LinearGradient 
          colors={item.color} 
          style={styles.gradientBg} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={[styles.emojiContainer, { transform: [{ scale }], opacity }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
          </Animated.View>
        </LinearGradient>
        <View style={styles.textContainer}>
          {/* ✅ AVANT: {item.title} */}
          {/* ✅ APRÈS: */}
          <Animated.Text style={[styles.title, { opacity }]}>
            {t(item.titleKey)}
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { opacity }]}>
            {t(item.subtitleKey)}
          </Animated.Text>
          <Animated.Text style={[styles.description, { opacity }]}>
            {t(item.descriptionKey)}
          </Animated.Text>
        </View>
      </View>
    );
  };

  const renderPagination = () => (
    <View style={styles.pagination}>
      {ONBOARDING_DATA.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 25, 8], extrapolate: 'clamp' });
        const dotOpacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
        return (
          <Animated.View
            key={index}
            style={[styles.dot, { width: dotWidth, opacity: dotOpacity, backgroundColor: ONBOARDING_DATA[currentIndex].color[0] }]}
          />
        );
      })}
    </View>
  );

  const onMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    console.log(`${LOG_PREFIX} 📜 Scroll ended at slide ${index + 1}`);
    setCurrentIndex(index);
  };

  console.log(`${LOG_PREFIX} 🎨 Rendering UI (slide ${currentIndex + 1}/${ONBOARDING_DATA.length})...`);

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        {/* ✅ AVANT: 'تخطي' */}
        <Text style={styles.skipText}>{t('common.skip')}</Text>
      </TouchableOpacity>

      {/* Slides FlatList */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }], 
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
      />

      {/* Pagination Dots */}
      {renderPagination()}

      {/* Next/Start Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          {/* ✅ FIX: Utiliser ONBOARDING_DATA[currentIndex].color directement */}
          <LinearGradient 
            colors={ONBOARDING_DATA[currentIndex].color} 
            style={styles.nextButtonGradient} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextButtonText}>
              {/* ✅ AVANT: 'ابدأ الآن' / 'التالي' */}
              {currentIndex === ONBOARDING_DATA.length - 1 
                ? t('onboarding.startNow') 
                : t('common.next')
              }
            </Text>
            <Text style={styles.nextButtonIcon}>
              {currentIndex === ONBOARDING_DATA.length - 1 ? '🚀' : '→'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Progress Text */}
      <Text style={styles.progressText}>
        {currentIndex + 1} / {ONBOARDING_DATA.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  skipButton: { position: 'absolute', top: 50, right: 25, zIndex: 10, padding: 10 },
  skipText: { color: '#aaa', fontSize: 16 },
  slide: { width, alignItems: 'center' },
  gradientBg: { 
    width: width * 0.8, 
    height: height * 0.4, 
    borderRadius: 30, 
    marginTop: 100, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emojiContainer: { 
    width: 150, 
    height: 150, 
    borderRadius: 75, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emoji: { fontSize: 80 },
  textContainer: { paddingHorizontal: 40, alignItems: 'center', marginTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#4CAF50', textAlign: 'center', marginBottom: 15 },
  description: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 24 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  buttonContainer: { paddingHorizontal: 40, marginTop: 40 },
  nextButton: { borderRadius: 25, overflow: 'hidden' },
  nextButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
  nextButtonIcon: { color: '#fff', fontSize: 20 },
  progressText: { color: '#666', textAlign: 'center', marginTop: 20, marginBottom: 30 }
});