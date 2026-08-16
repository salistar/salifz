/**
 * Chat Video Screen - Salifz
 * Video calling between users
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Camera, CameraType } from 'expo-camera';
import { useAuthStore } from '../../stores';
import { socketService } from '../../services/socket';
import { COLORS } from '../../config';

const { width, height } = Dimensions.get('window');

type CallState = 'connecting' | 'ringing' | 'connected' | 'ended';

export default function ChatVideoScreen({ route, navigation }: any) {
  const { recipientId, recipientName, recipientAvatar, isIncoming } = route.params || {};
  const { user } = useAuthStore();
  
  const [callState, setCallState] = useState<CallState>(isIncoming ? 'ringing' : 'connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [cameraType, setCameraType] = useState(CameraType.front);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    requestCameraPermission();
    setupCall();
    
    return () => {
      endCall();
      if (durationInterval.current) clearInterval(durationInterval.current);
    };
  }, []);

  useEffect(() => {
    if (callState === 'connecting' || callState === 'ringing') startPulseAnimation();
  }, [callState]);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status !== 'granted') {
      Alert.alert('إذن الكاميرا', 'يحتاج التطبيق إلى إذن الكاميرا', [{ text: 'حسناً', onPress: () => navigation.goBack() }]);
    }
  };

  const setupCall = () => {
    if (!isIncoming) {
      setTimeout(() => setCallState('ringing'), 1500);
      setTimeout(() => { setCallState('connected'); startCallTimer(); }, 4000);
    }
    socketService.on('callAccepted', handleCallAccepted);
    socketService.on('callEnded', handleCallEnded);
    socketService.on('callRejected', handleCallRejected);
  };

  const handleCallAccepted = () => { setCallState('connected'); startCallTimer(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); };
  const handleCallEnded = () => { setCallState('ended'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); setTimeout(() => navigation.goBack(), 1500); };
  const handleCallRejected = () => { Alert.alert('المكالمة', 'تم رفض المكالمة'); navigation.goBack(); };

  const startPulseAnimation = () => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  };

  const startCallTimer = () => { durationInterval.current = setInterval(() => setCallDuration(prev => prev + 1), 1000); };
  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const acceptCall = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setCallState('connected'); startCallTimer(); socketService.emit('acceptCall', { recipientId }); };
  const rejectCall = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); socketService.emit('rejectCall', { recipientId }); navigation.goBack(); };
  const endCall = () => { 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); 
    socketService.emit('endCall', { recipientId }); 
    setCallState('ended'); 
    if (durationInterval.current) clearInterval(durationInterval.current); 
    setTimeout(() => navigation.goBack(), 500); 
  };

  const toggleMute = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsMuted(!isMuted); };
  const toggleVideo = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsVideoOff(!isVideoOff); };
  const toggleSpeaker = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsSpeakerOn(!isSpeakerOn); };
  const flipCamera = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCameraType(current => current === CameraType.back ? CameraType.front : CameraType.back); };

  const renderCallingState = () => (
    <View style={styles.callingContainer}>
      <Animated.View style={[styles.avatarLarge, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.avatarLargeText}>{recipientName?.charAt(0) || '👤'}</Text>
      </Animated.View>
      <Text style={styles.callingName}>{recipientName || 'مستخدم'}</Text>
      <Text style={styles.callingStatus}>
        {callState === 'connecting' && 'جاري الاتصال...'}
        {callState === 'ringing' && 'جاري الرنين...'}
      </Text>
      <View style={styles.callingActions}>
        <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
          <LinearGradient colors={['#F44336', '#D32F2F']} style={styles.endCallGradient}>
            <Text style={styles.endCallIcon}>📞</Text>
          </LinearGradient>
          <Text style={styles.actionLabel}>إنهاء</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderIncomingCall = () => (
    <View style={styles.callingContainer}>
      <Animated.View style={[styles.avatarLarge, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.avatarLargeText}>{recipientName?.charAt(0) || '👤'}</Text>
      </Animated.View>
      <Text style={styles.callingName}>{recipientName || 'مستخدم'}</Text>
      <Text style={styles.callingStatus}>مكالمة فيديو واردة...</Text>
      <View style={styles.incomingActions}>
        <TouchableOpacity style={styles.rejectButton} onPress={rejectCall}>
          <LinearGradient colors={['#F44336', '#D32F2F']} style={styles.actionButtonGradient}>
            <Text style={styles.actionButtonIcon}>✕</Text>
          </LinearGradient>
          <Text style={styles.actionLabel}>رفض</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={acceptCall}>
          <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.actionButtonGradient}>
            <Text style={styles.actionButtonIcon}>📹</Text>
          </LinearGradient>
          <Text style={styles.actionLabel}>قبول</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConnectedCall = () => (
    <View style={styles.connectedContainer}>
      <View style={styles.remoteVideo}>
        <View style={styles.remoteVideoPlaceholder}>
          <Text style={styles.remoteAvatarText}>{recipientName?.charAt(0) || '👤'}</Text>
          <Text style={styles.remoteNameText}>{recipientName}</Text>
        </View>
      </View>
      <View style={styles.localVideo}>
        {hasPermission && !isVideoOff ? (
          <Camera style={styles.camera} type={cameraType} />
        ) : (
          <View style={styles.localVideoOff}>
            <Text style={styles.localVideoOffIcon}>📷</Text>
            <Text style={styles.localVideoOffText}>الكاميرا مغلقة</Text>
          </View>
        )}
      </View>
      <View style={styles.callInfo}>
        <Text style={styles.callInfoName}>{recipientName}</Text>
        <Text style={styles.callInfoDuration}>{formatDuration(callDuration)}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlButton, isMuted && styles.controlButtonActive]} onPress={toggleMute}>
          <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
          <Text style={styles.controlLabel}>{isMuted ? 'إلغاء الكتم' : 'كتم'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, isVideoOff && styles.controlButtonActive]} onPress={toggleVideo}>
          <Text style={styles.controlIcon}>{isVideoOff ? '📷' : '📹'}</Text>
          <Text style={styles.controlLabel}>{isVideoOff ? 'تشغيل' : 'إيقاف'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={flipCamera}>
          <Text style={styles.controlIcon}>🔄</Text>
          <Text style={styles.controlLabel}>تبديل</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]} onPress={toggleSpeaker}>
          <Text style={styles.controlIcon}>{isSpeakerOn ? '🔊' : '🔈'}</Text>
          <Text style={styles.controlLabel}>مكبر</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.endCallButtonSmall} onPress={endCall}>
          <LinearGradient colors={['#F44336', '#D32F2F']} style={styles.endCallSmallGradient}>
            <Text style={styles.endCallSmallIcon}>📞</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={callState === 'connected' ? ['#1a1a2e', '#16213e'] : [COLORS.primary, '#2E7D32']} style={styles.gradient}>
        {callState === 'ringing' && isIncoming && renderIncomingCall()}
        {(callState === 'connecting' || (callState === 'ringing' && !isIncoming)) && renderCallingState()}
        {callState === 'connected' && renderConnectedCall()}
        {callState === 'ended' && (
          <View style={styles.endedContainer}>
            <Text style={styles.endedIcon}>📞</Text>
            <Text style={styles.endedText}>انتهت المكالمة</Text>
            <Text style={styles.endedDuration}>{formatDuration(callDuration)}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  callingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  avatarLarge: { width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  avatarLargeText: { fontSize: 60, color: '#fff' },
  callingName: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  callingStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  callingActions: { position: 'absolute', bottom: 100 },
  incomingActions: { flexDirection: 'row', position: 'absolute', bottom: 100 },
  endCallButton: { alignItems: 'center' },
  endCallGradient: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '135deg' }] },
  endCallIcon: { fontSize: 30, transform: [{ rotate: '-135deg' }] },
  rejectButton: { alignItems: 'center', marginRight: 60 },
  acceptButton: { alignItems: 'center', marginLeft: 60 },
  actionButtonGradient: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  actionButtonIcon: { fontSize: 30, color: '#fff' },
  actionLabel: { color: '#fff', marginTop: 10, fontSize: 14 },
  connectedContainer: { flex: 1 },
  remoteVideo: { flex: 1, backgroundColor: '#000' },
  remoteVideoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  remoteAvatarText: { fontSize: 80, color: '#fff', marginBottom: 10 },
  remoteNameText: { color: '#fff', fontSize: 20 },
  localVideo: { position: 'absolute', top: 50, right: 20, width: 120, height: 160, borderRadius: 15, overflow: 'hidden', borderWidth: 2, borderColor: '#fff' },
  camera: { flex: 1 },
  localVideoOff: { flex: 1, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  localVideoOffIcon: { fontSize: 30 },
  localVideoOffText: { color: '#fff', fontSize: 10, marginTop: 5 },
  callInfo: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' },
  callInfoName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  callInfoDuration: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  controlButton: { alignItems: 'center', padding: 10 },
  controlButtonActive: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15 },
  controlIcon: { fontSize: 28 },
  controlLabel: { color: '#fff', fontSize: 10, marginTop: 5 },
  endCallButtonSmall: { borderRadius: 30, overflow: 'hidden' },
  endCallSmallGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  endCallSmallIcon: { fontSize: 26, transform: [{ rotate: '135deg' }] },
  endedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  endedIcon: { fontSize: 60, marginBottom: 20, transform: [{ rotate: '135deg' }] },
  endedText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  endedDuration: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginTop: 10 },
});