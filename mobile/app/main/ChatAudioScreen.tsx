/**
 * Chat Audio Screen - Salifz
 * Audio calling between users
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../stores';
import { socketService } from '../../services/socket';
import { COLORS } from '../../config';

const { width, height } = Dimensions.get('window');
type CallState = 'connecting' | 'ringing' | 'connected' | 'ended';

export default function ChatAudioScreen({ route, navigation }: any) {
  const { recipientId, recipientName, isIncoming } = route.params || {};
  const { user } = useAuthStore();
  
  const [callState, setCallState] = useState<CallState>(isIncoming ? 'ringing' : 'connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;
  const durationInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setupCall();
    return () => { if (durationInterval.current) clearInterval(durationInterval.current); };
  }, []);

  useEffect(() => {
    if (callState === 'connecting' || callState === 'ringing') startPulseAnimation();
    else if (callState === 'connected') startWaveAnimation();
  }, [callState]);

  const setupCall = () => {
    if (!isIncoming) {
      setTimeout(() => setCallState('ringing'), 1500);
      setTimeout(() => { setCallState('connected'); startCallTimer(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, 4000);
    }
    socketService.on('callAccepted', () => { setCallState('connected'); startCallTimer(); });
    socketService.on('callEnded', () => { setCallState('ended'); setTimeout(() => navigation.goBack(), 1500); });
    socketService.on('callRejected', () => { Alert.alert('المكالمة', 'تم رفض المكالمة'); navigation.goBack(); });
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

  const startCallTimer = () => { durationInterval.current = setInterval(() => setCallDuration(prev => prev + 1), 1000); };
  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const acceptCall = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setCallState('connected'); startCallTimer(); socketService.emit('acceptCall', { recipientId }); };
  const rejectCall = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); socketService.emit('rejectCall', { recipientId }); navigation.goBack(); };
  const endCall = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); socketService.emit('endCall', { recipientId }); setCallState('ended'); if (durationInterval.current) clearInterval(durationInterval.current); setTimeout(() => navigation.goBack(), 500); };
  const toggleMute = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsMuted(!isMuted); };
  const toggleSpeaker = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsSpeakerOn(!isSpeakerOn); };

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

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
        <View style={styles.bgDecor1} />
        <View style={styles.bgDecor2} />
        
        <View style={styles.content}>
          <View style={styles.avatarContainer}>
            {callState === 'connected' && renderWaves()}
            <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: callState !== 'connected' ? pulseAnim : 1 }] }]}>
              <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.avatarGradient}>
                <Text style={styles.avatarText}>{recipientName?.charAt(0) || '👤'}</Text>
              </LinearGradient>
            </Animated.View>
          </View>
          
          <Text style={styles.userName}>{recipientName || 'مستخدم'}</Text>
          <Text style={styles.callStatus}>
            {callState === 'connecting' && 'جاري الاتصال...'}
            {callState === 'ringing' && (isIncoming ? 'مكالمة صوتية واردة' : 'جاري الرنين...')}
            {callState === 'connected' && formatDuration(callDuration)}
            {callState === 'ended' && 'انتهت المكالمة'}
          </Text>
          
          <View style={styles.encryptionBadge}>
            <Text style={styles.encryptionIcon}>🔒</Text>
            <Text style={styles.encryptionText}>مكالمة مشفرة</Text>
          </View>
        </View>
        
        <View style={styles.controlsContainer}>
          {(callState === 'ringing' && isIncoming) ? (
            <View style={styles.incomingControls}>
              <TouchableOpacity style={styles.controlItem} onPress={rejectCall}>
                <View style={styles.rejectButton}><Text style={styles.rejectIcon}>✕</Text></View>
                <Text style={styles.controlLabel}>رفض</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlItem} onPress={acceptCall}>
                <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.acceptButton}>
                  <Text style={styles.acceptIcon}>📞</Text>
                </LinearGradient>
                <Text style={styles.controlLabel}>قبول</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.regularControls}>
              <TouchableOpacity style={[styles.controlItem, isMuted && styles.controlItemActive]} onPress={toggleMute}>
                <View style={[styles.controlButton, isMuted && styles.controlButtonActive]}>
                  <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
                </View>
                <Text style={styles.controlLabel}>{isMuted ? 'إلغاء الكتم' : 'كتم'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlItem} onPress={endCall}>
                <View style={styles.endCallButton}><Text style={styles.endCallIcon}>📞</Text></View>
                <Text style={styles.controlLabel}>إنهاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlItem, isSpeakerOn && styles.controlItemActive]} onPress={toggleSpeaker}>
                <View style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}>
                  <Text style={styles.controlIcon}>{isSpeakerOn ? '🔊' : '🔈'}</Text>
                </View>
                <Text style={styles.controlLabel}>{isSpeakerOn ? 'سماعة' : 'مكبر'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {callState === 'connected' && (
          <View style={styles.extraActions}>
            <TouchableOpacity style={styles.extraButton} onPress={() => navigation.navigate('ChatVideo', { recipientId, recipientName })}>
              <Text style={styles.extraIcon}>📹</Text>
              <Text style={styles.extraLabel}>تشغيل الفيديو</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bgDecor1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(76, 175, 80, 0.05)', top: -100, right: -100 },
  bgDecor2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(76, 175, 80, 0.05)', bottom: -50, left: -50 },
  content: { alignItems: 'center', marginBottom: 60 },
  avatarContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  wavesContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  wave: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: COLORS.primary },
  avatarWrapper: { zIndex: 10 },
  avatarGradient: { width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  avatarText: { fontSize: 60, color: '#fff' },
  userName: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
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
  controlButtonActive: { backgroundColor: COLORS.primary },
  controlIcon: { fontSize: 28 },
  controlLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 },
  rejectButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F44336', justifyContent: 'center', alignItems: 'center' },
  rejectIcon: { fontSize: 30, color: '#fff' },
  acceptButton: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  acceptIcon: { fontSize: 30 },
  endCallButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F44336', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '135deg' }] },
  endCallIcon: { fontSize: 30, transform: [{ rotate: '-135deg' }] },
  extraActions: { position: 'absolute', bottom: 180 },
  extraButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  extraIcon: { fontSize: 20, marginRight: 8 },
  extraLabel: { color: '#fff', fontSize: 14 },
});