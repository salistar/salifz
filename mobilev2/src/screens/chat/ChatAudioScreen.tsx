/**
 * ============================================
 * 📱 ChatAudioScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ ENHANCED: More detailed console.log
 * Audio calling between users
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../stores';
import { socketService } from '../../services/socket';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');
type CallState = 'connecting' | 'ringing' | 'connected' | 'ended';

// ✅ Constante pour les logs
const LOG_PREFIX = '[ChatAudioScreen.tsx]';

export default function ChatAudioScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const { recipientId, recipientName, isIncoming } = route.params || {};
  const { user } = useAuthStore();
  
  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  console.log(`${LOG_PREFIX} 📞 Call params: recipientId=${recipientId}, recipientName=${recipientName}, isIncoming=${isIncoming}`);
  
  const [callState, setCallState] = useState<CallState>(isIncoming ? 'ringing' : 'connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;
  const durationInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    console.log(`${LOG_PREFIX} 🔄 useEffect: Setting up call...`);
    setupCall();
    return () => { 
      console.log(`${LOG_PREFIX} 🧹 Cleanup: Clearing interval...`);
      if (durationInterval.current) clearInterval(durationInterval.current); 
    };
  }, []);

  useEffect(() => {
    console.log(`${LOG_PREFIX} 📊 Call state changed: ${callState}`);
    if (callState === 'connecting' || callState === 'ringing') {
      console.log(`${LOG_PREFIX} 🎬 Starting pulse animation...`);
      startPulseAnimation();
    } else if (callState === 'connected') {
      console.log(`${LOG_PREFIX} 🎬 Starting wave animation...`);
      startWaveAnimation();
    }
  }, [callState]);

  const setupCall = () => {
    console.log(`${LOG_PREFIX} 🔧 ========== SETUP CALL START ==========`);
    
    if (!isIncoming) {
      console.log(`${LOG_PREFIX} 📤 Outgoing call - simulating connection...`);
      setTimeout(() => {
        console.log(`${LOG_PREFIX} 🔔 State: connecting -> ringing`);
        setCallState('ringing');
      }, 1500);
      setTimeout(() => { 
        console.log(`${LOG_PREFIX} ✅ State: ringing -> connected`);
        setCallState('connected'); 
        startCallTimer(); 
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 
      }, 4000);
    }
    
    console.log(`${LOG_PREFIX} 🔌 Setting up socket listeners...`);
    socketService.on('callAccepted', () => { 
      console.log(`${LOG_PREFIX} ✅ Socket: callAccepted received`);
      setCallState('connected'); 
      startCallTimer(); 
    });
    socketService.on('callEnded', () => { 
      console.log(`${LOG_PREFIX} 📴 Socket: callEnded received`);
      setCallState('ended'); 
      setTimeout(() => navigation.goBack(), 1500); 
    });
    socketService.on('callRejected', () => { 
      console.log(`${LOG_PREFIX} ❌ Socket: callRejected received`);
      // ✅ AVANT: Alert.alert('المكالمة', 'تم رفض المكالمة');
      Alert.alert(t('call.title'), t('call.rejected')); 
      navigation.goBack(); 
    });
    
    console.log(`${LOG_PREFIX} 🔧 ========== SETUP CALL END ==========`);
  };

  const startPulseAnimation = () => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])).start();
  };

  const startWaveAnimation = () => {
    const createWave = (anim: Animated.Value, delay: number) => {
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])).start();
    };
    createWave(waveAnim1, 0);
    createWave(waveAnim2, 500);
    createWave(waveAnim3, 1000);
  };

  const startCallTimer = () => { 
    console.log(`${LOG_PREFIX} ⏱️ Starting call timer...`);
    durationInterval.current = setInterval(() => setCallDuration(prev => prev + 1), 1000); 
  };
  
  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const acceptCall = () => { 
    console.log(`${LOG_PREFIX} ✅ Accept call pressed`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
    setCallState('connected'); 
    startCallTimer(); 
    socketService.emit('acceptCall', { recipientId }); 
  };
  
  const rejectCall = () => { 
    console.log(`${LOG_PREFIX} ❌ Reject call pressed`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); 
    socketService.emit('rejectCall', { recipientId }); 
    navigation.goBack(); 
  };
  
  const endCall = () => { 
    console.log(`${LOG_PREFIX} 📴 End call pressed`);
    console.log(`${LOG_PREFIX} ⏱️ Call duration: ${formatDuration(callDuration)}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); 
    socketService.emit('endCall', { recipientId }); 
    setCallState('ended'); 
    if (durationInterval.current) clearInterval(durationInterval.current); 
    setTimeout(() => navigation.goBack(), 500); 
  };
  
  const toggleMute = () => { 
    console.log(`${LOG_PREFIX} 🔇 Toggle mute: ${!isMuted}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
    setIsMuted(!isMuted); 
  };
  
  const toggleSpeaker = () => { 
    console.log(`${LOG_PREFIX} 🔊 Toggle speaker: ${!isSpeakerOn}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
    setIsSpeakerOn(!isSpeakerOn); 
  };

  const renderWaves = () => (
    <View style={styles.wavesContainer}>
      {[waveAnim1, waveAnim2, waveAnim3].map((anim, i) => (
        <Animated.View key={i} style={[styles.wave, { 
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }]
        }]} />
      ))}
    </View>
  );

  // ✅ Helper function to get call status text
  const getCallStatusText = () => {
    switch (callState) {
      case 'connecting':
        // ✅ AVANT: 'جاري الاتصال...'
        return t('call.connecting');
      case 'ringing':
        // ✅ AVANT: 'مكالمة صوتية واردة' / 'جاري الرنين...'
        return isIncoming ? t('call.incomingAudio') : t('call.ringing');
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        // ✅ AVANT: 'انتهت المكالمة'
        return t('call.ended');
      default:
        return '';
    }
  };

  console.log(`${LOG_PREFIX} 🎨 Rendering UI (state: ${callState}, duration: ${callDuration}s)...`);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.canvasDeep, colors.canvasDeepAlt, colors.canvasDeepAlt]} style={styles.gradient}>
        <View style={styles.bgDecor1} />
        <View style={styles.bgDecor2} />
        
        <View style={styles.content}>
          <View style={styles.avatarContainer}>
            {callState === 'connected' && renderWaves()}
            <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: callState !== 'connected' ? pulseAnim : 1 }] }]}>
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.avatarGradient}>
                <Text style={styles.avatarText}>{recipientName?.charAt(0) || '👤'}</Text>
              </LinearGradient>
            </Animated.View>
          </View>
          
          {/* ✅ AVANT: {recipientName || 'مستخدم'} */}
          <Text style={styles.userName}>{recipientName || t('common.user')}</Text>
          <Text style={styles.callStatus}>{getCallStatusText()}</Text>
          
          <View style={styles.encryptionBadge}>
            <Text style={styles.encryptionIcon}>🔒</Text>
            {/* ✅ AVANT: 'مكالمة مشفرة' */}
            <Text style={styles.encryptionText}>{t('call.encrypted')}</Text>
          </View>
        </View>
        
        <View style={styles.controlsContainer}>
          {(callState === 'ringing' && isIncoming) ? (
            <View style={styles.incomingControls}>
              <TouchableOpacity accessible accessibilityRole="button" style={styles.controlItem} onPress={rejectCall}>
                <View style={styles.rejectButton}><Text style={styles.rejectIcon}>✕</Text></View>
                {/* ✅ AVANT: 'رفض' */}
                <Text style={styles.controlLabel}>{t('call.reject')}</Text>
              </TouchableOpacity>
              <TouchableOpacity accessible accessibilityRole="button" style={styles.controlItem} onPress={acceptCall}>
                <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.acceptButton}>
                  <Text style={styles.acceptIcon}>📞</Text>
                </LinearGradient>
                {/* ✅ AVANT: 'قبول' */}
                <Text style={styles.controlLabel}>{t('call.accept')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.regularControls}>
              <TouchableOpacity accessible accessibilityRole="button" style={[styles.controlItem, isMuted && styles.controlItemActive]} onPress={toggleMute}>
                <View style={[styles.controlButton, isMuted && styles.controlButtonActive]}>
                  <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
                </View>
                {/* ✅ AVANT: 'إلغاء الكتم' / 'كتم' */}
                <Text style={styles.controlLabel}>{isMuted ? t('call.unmute') : t('call.mute')}</Text>
              </TouchableOpacity>
              <TouchableOpacity accessible accessibilityRole="button" style={styles.controlItem} onPress={endCall}>
                <View style={styles.endCallButton}><Text style={styles.endCallIcon}>📞</Text></View>
                {/* ✅ AVANT: 'إنهاء' */}
                <Text style={styles.controlLabel}>{t('call.end')}</Text>
              </TouchableOpacity>
              <TouchableOpacity accessible accessibilityRole="button" style={[styles.controlItem, isSpeakerOn && styles.controlItemActive]} onPress={toggleSpeaker}>
                <View style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}>
                  <Text style={styles.controlIcon}>{isSpeakerOn ? '🔊' : '🔈'}</Text>
                </View>
                {/* ✅ AVANT: 'سماعة' / 'مكبر' */}
                <Text style={styles.controlLabel}>{isSpeakerOn ? t('call.speakerOn') : t('call.speakerOff')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {callState === 'connected' && (
          <View style={styles.extraActions}>
            <TouchableOpacity accessible accessibilityRole="button" 
              style={styles.extraButton} 
              onPress={() => {
                console.log(`${LOG_PREFIX} 📹 Switch to video call`);
                navigation.navigate('ChatVideo', { recipientId, recipientName });
              }}
            >
              <Text style={styles.extraIcon}>📹</Text>
              {/* ✅ AVANT: 'تشغيل الفيديو' */}
              <Text style={styles.extraLabel}>{t('call.enableVideo')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bgDecor1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(76, 175, 80, 0.05)', top: -100, right: -100 },
  bgDecor2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(76, 175, 80, 0.05)', bottom: -50, left: -50 },
  content: { alignItems: 'center', marginBottom: 60 },
  avatarContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  wavesContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  wave: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: c.primary },
  avatarWrapper: { zIndex: 10 },
  avatarGradient: { width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  avatarText: { fontSize: 60, color: c.onDeep },
  userName: { color: c.onDeep, fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  callStatus: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  encryptionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginTop: 20 },
  encryptionIcon: { fontSize: 14, marginRight: 6 },
  encryptionText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  controlsContainer: { position: 'absolute', bottom: 80 },
  incomingControls: { flexDirection: 'row', alignItems: 'center' },
  regularControls: { flexDirection: 'row', alignItems: 'center' },
  controlItem: { alignItems: 'center', marginHorizontal: 25 },
  controlItemActive: {},
  controlButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  controlButtonActive: { backgroundColor: c.primary },
  controlIcon: { fontSize: 28 },
  controlLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 },
  rejectButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: c.error, justifyContent: 'center', alignItems: 'center' },
  rejectIcon: { fontSize: 30, color: c.onDeep },
  acceptButton: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  acceptIcon: { fontSize: 30 },
  endCallButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: c.error, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '135deg' }] },
  endCallIcon: { fontSize: 30, transform: [{ rotate: '-135deg' }] },
  extraActions: { position: 'absolute', bottom: 180 },
  extraButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  extraIcon: { fontSize: 20, marginRight: 8 },
  extraLabel: { color: c.onDeep, fontSize: 14 },
});