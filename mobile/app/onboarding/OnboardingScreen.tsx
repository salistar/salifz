import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, FlatList, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../config';

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = [
  { id: '1', emoji: '📖', title: 'احفظ القرآن بسهولة', subtitle: 'طريقة مبتكرة وممتعة لحفظ القرآن الكريم', description: 'نظام تعليمي متكامل يساعدك على الحفظ والمراجعة بطريقة علمية', color: ['#4CAF50', '#2E7D32'] as const },
  { id: '2', emoji: '🎯', title: 'تحديات يومية', subtitle: 'ابقَ متحمساً مع التحديات والمكافآت', description: 'أكمل التحديات اليومية واربح النقاط والجواهر لفتح ميزات جديدة', color: ['#FF9800', '#F57C00'] as const },
  { id: '3', emoji: '🔥', title: 'حافظ على سلسلتك', subtitle: 'تدرب يومياً وشاهد تقدمك', description: 'نظام السلسلة يحفزك للتدرب كل يوم وبناء عادة الحفظ', color: ['#F44336', '#D32F2F'] as const },
  { id: '4', emoji: '🏆', title: 'تنافس مع الأصدقاء', subtitle: 'انضم للدوريات وتسلق الترتيب', description: 'تنافس مع الآخرين في الدوريات الأسبوعية واربح المراكز المتقدمة', color: ['#9C27B0', '#7B1FA2'] as const },
  { id: '5', emoji: '🤖', title: 'مدعوم بالذكاء الاصطناعي', subtitle: 'خطط مخصصة لك', description: 'الذكاء الاصطناعي يحلل أداءك ويقدم لك خطة حفظ مخصصة', color: ['#2196F3', '#1976D2'] as const }
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    navigation.replace('Register');
  };

  const renderItem = ({ item, index }: any) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = scrollX.interpolate({ inputRange, outputRange: [0.8, 1, 0.8], extrapolate: 'clamp' });
    const opacity = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });

    return (
      <View style={styles.slide}>
        <LinearGradient colors={[...item.color]} style={styles.gradientBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Animated.View style={[styles.emojiContainer, { transform: [{ scale }], opacity }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
          </Animated.View>
        </LinearGradient>
        <View style={styles.textContainer}>
          <Animated.Text style={[styles.title, { opacity }]}>{item.title}</Animated.Text>
          <Animated.Text style={[styles.subtitle, { opacity }]}>{item.subtitle}</Animated.Text>
          <Animated.Text style={[styles.description, { opacity }]}>{item.description}</Animated.Text>
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>تخطي</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {renderPagination()}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient colors={[...ONBOARDING_DATA[currentIndex].color]} style={styles.nextButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.nextButtonText}>
              {currentIndex === ONBOARDING_DATA.length - 1 ? 'ابدأ الآن' : 'التالي'}
            </Text>
            <Text style={styles.nextButtonIcon}>
              {currentIndex === ONBOARDING_DATA.length - 1 ? '🚀' : '→'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.progressText}>{currentIndex + 1} / {ONBOARDING_DATA.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  skipButton: { position: 'absolute', top: 50, right: 25, zIndex: 10, padding: 10 },
  skipText: { color: '#aaa', fontSize: 16 },
  slide: { width, alignItems: 'center' },
  gradientBg: { width: width * 0.8, height: height * 0.4, borderRadius: 30, marginTop: 100, justifyContent: 'center', alignItems: 'center' },
  emojiContainer: { width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
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