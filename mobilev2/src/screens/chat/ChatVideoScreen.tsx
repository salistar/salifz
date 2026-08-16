/**
 * ============================================
 * 📱 ChatVideoScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ FIXED: expo-camera TypeScript errors (SDK 51+)
 * ✅ ENHANCED: More detailed console.log
 * Video calling between users
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
// ✅ FIX: Use CameraView instead of Camera for SDK 51+
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuthStore } from '../../stores';
import { socketService } from '../../services/socket';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

const { width, height } = Dimensions.get('window');

type CallState = 'connecting' | 'ringing' | 'connected' | 'ended';
// ✅ FIX: Define CameraFacing type (replaces CameraType)
type CameraFacing = 'front' | 'back';

// ✅ Constante pour les logs
const LOG_PREFIX = '[ChatVideoScreen.tsx]';

export default function ChatVideoScreen({ route, navigation }: any) {
  const { recipientId, recipientName, recipientAvatar, isIncoming } = route.params || {};
  const { user } = useAuthStore();
  
  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  console.log(`${LOG_PREFIX} 📹 Call params: recipientId=${recipientId}, recipientName=${recipientName}, isIncoming=${isIncoming}`);
  
  const [callState, setCallState] = useState<CallState>(isIncoming ? 'ringing' : 'connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  // ✅ FIX: Use string literal type instead of CameraType enum
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('front');
  
  // ✅ FIX: Use useCameraPermissions hook
  const [permission, requestPermission] = useCameraPermissions();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    console.log(`${LOG_PREFIX} 🔄 useEffect: Initializing video call...`);
    requestCameraPermission();
    setupCall();
    
    return () => {
      console.log(`${LOG_PREFIX} 🧹 Cleanup: Ending call and clearing interval...`);
      endCall();
      if (durationInterval.current) clearInterval(durationInterval.current);
    };
  }, []);

  useEffect(() => {
    console.log(`${LOG_PREFIX} 📊 Call state changed: ${callState}`);
    if (callState === 'connecting' || callState === 'ringing') {
      console.log(`${LOG_PREFIX} 🎬 Starting pulse animation...`);
      startPulseAnimation();
    }
  }, [callState]);

  const requestCameraPermission = async () => {
    console.log(`${LOG_PREFIX} 📷 Requesting camera permission...`);
    const result = await requestPermission();
    console.log(`${LOG_PREFIX} 📷 Permission result: ${result?.granted}`);
    
    if (!result?.granted) {
      console.log(`${LOG_PREFIX} ❌ Camera permission denied`);
      // ✅ AVANT: Alert.alert('إذن الكاميرا', 'يحتاج التطبيق إلى إذن الكاميرا', ...);
      Alert.alert(
        t('permissions.cameraTitle'), 
        t('permissions.cameraMessage'), 
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    }
  };

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
      }, 4000);
    }
    
    console.log(`${LOG_PREFIX} 🔌 Setting up socket listeners...`);
    socketService.on('callAccepted', handleCallAccepted);
    socketService.on('callEnded', handleCallEnded);
    socketService.on('callRejected', handleCallRejected);
    
    console.log(`${LOG_PREFIX} 🔧 ========== SETUP CALL END ==========`);
  };

  const handleCallAccepted = () => { 
    console.log(`${LOG_PREFIX} ✅ Socket: callAccepted received`);
    setCallState('connected'); 
    startCallTimer(); 
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 
  };
  
  const handleCallEnded = () => { 
    console.log(`${LOG_PREFIX} 📴 Socket: callEnded received`);
    setCallState('ended'); 
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); 
    setTimeout(() => navigation.goBack(), 1500); 
  };
  
  const handleCallRejected = () => { 
    console.log(`${LOG_PREFIX} ❌ Socket: callRejected received`);
    // ✅ AVANT: Alert.alert('المكالمة', 'تم رفض المكالمة');
    Alert.alert(t('call.title'), t('call.rejected')); 
    navigation.goBack(); 
  };

  const startPulseAnimation = () => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
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
  
  const toggleVideo = () => { 
    console.log(`${LOG_PREFIX} 📹 Toggle video: ${!isVideoOff}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
    setIsVideoOff(!isVideoOff); 
  };
  
  const toggleSpeaker = () => { 
    console.log(`${LOG_PREFIX} 🔊 Toggle speaker: ${!isSpeakerOn}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
    setIsSpeakerOn(!isSpeakerOn); 
  };
  
  const flipCamera = () => { 
    console.log(`${LOG_PREFIX} 🔄 Flip camera: ${cameraFacing === 'front' ? 'back' : 'front'}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
    // ✅ FIX: Use string literals instead of CameraType enum
    setCameraFacing(current => current === 'back' ? 'front' : 'back'); 
  };

  const renderCallingState = () => (
    <View style={styles.callingContainer}>
      <Animated.View style={[styles.avatarLarge, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.avatarLargeText}>{recipientName?.charAt(0) || '👤'}</Text>
      </Animated.View>
      {/* ✅ AVANT: {recipientName || 'مستخدم'} */}
      <Text style={styles.callingName}>{recipientName || t('common.user')}</Text>
      <Text style={styles.callingStatus}>
        {/* ✅ AVANT: 'جاري الاتصال...' / 'جاري الرنين...' */}
        {callState === 'connecting' && t('call.connecting')}
        {callState === 'ringing' && t('call.ringing')}
      </Text>
      <View style={styles.callingActions}>
        <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
          <LinearGradient colors={['#F44336', '#D32F2F']} style={styles.endCallGradient}>
            <Text style={styles.endCallIcon}>📞</Text>
          </LinearGradient>
          {/* ✅ AVANT: 'إنهاء' */}
          <Text style={styles.actionLabel}>{t('call.end')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderIncomingCall = () => (
    <View style={styles.callingContainer}>
      <Animated.View style={[styles.avatarLarge, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.avatarLargeText}>{recipientName?.charAt(0) || '👤'}</Text>
      </Animated.View>
      {/* ✅ AVANT: {recipientName || 'مستخدم'} */}
      <Text style={styles.callingName}>{recipientName || t('common.user')}</Text>
      {/* ✅ AVANT: 'مكالمة فيديو واردة...' */}
      <Text style={styles.callingStatus}>{t('call.incomingVideo')}</Text>
      <View style={styles.incomingActions}>
        <TouchableOpacity style={styles.rejectButton} onPress={rejectCall}>
          <LinearGradient colors={['#F44336', '#D32F2F']} style={styles.actionButtonGradient}>
            <Text style={styles.actionButtonIcon}>✕</Text>
          </LinearGradient>
          {/* ✅ AVANT: 'رفض' */}
          <Text style={styles.actionLabel}>{t('call.reject')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={acceptCall}>
          <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.actionButtonGradient}>
            <Text style={styles.actionButtonIcon}>📹</Text>
          </LinearGradient>
          {/* ✅ AVANT: 'قبول' */}
          <Text style={styles.actionLabel}>{t('call.accept')}</Text>
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
        {permission?.granted && !isVideoOff ? (
          // ✅ FIX: Use CameraView instead of Camera, and 'facing' prop instead of 'type'
          <CameraView style={styles.camera} facing={cameraFacing} />
        ) : (
          <View style={styles.localVideoOff}>
            <Text style={styles.localVideoOffIcon}>📷</Text>
            {/* ✅ AVANT: 'الكاميرا مغلقة' */}
            <Text style={styles.localVideoOffText}>{t('call.cameraOff')}</Text>
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
          {/* ✅ AVANT: 'إلغاء الكتم' / 'كتم' */}
          <Text style={styles.controlLabel}>{isMuted ? t('call.unmute') : t('call.mute')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, isVideoOff && styles.controlButtonActive]} onPress={toggleVideo}>
          <Text style={styles.controlIcon}>{isVideoOff ? '📷' : '📹'}</Text>
          {/* ✅ AVANT: 'تشغيل' / 'إيقاف' */}
          <Text style={styles.controlLabel}>{isVideoOff ? t('call.videoOn') : t('call.videoOff')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={flipCamera}>
          <Text style={styles.controlIcon}>🔄</Text>
          {/* ✅ AVANT: 'تبديل' */}
          <Text style={styles.controlLabel}>{t('call.flip')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]} onPress={toggleSpeaker}>
          <Text style={styles.controlIcon}>{isSpeakerOn ? '🔊' : '🔈'}</Text>
          {/* ✅ AVANT: 'مكبر' */}
          <Text style={styles.controlLabel}>{t('call.speaker')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.endCallButtonSmall} onPress={endCall}>
          <LinearGradient colors={['#F44336', '#D32F2F']} style={styles.endCallSmallGradient}>
            <Text style={styles.endCallSmallIcon}>📞</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  console.log(`${LOG_PREFIX} 🎨 Rendering UI (state: ${callState}, duration: ${callDuration}s)...`);

  return (
    <View style={styles.container}>
      <LinearGradient colors={callState === 'connected' ? ['#1a1a2e', '#16213e'] : [COLORS.primary, '#2E7D32']} style={styles.gradient}>
        {callState === 'ringing' && isIncoming && renderIncomingCall()}
        {(callState === 'connecting' || (callState === 'ringing' && !isIncoming)) && renderCallingState()}
        {callState === 'connected' && renderConnectedCall()}
        {callState === 'ended' && (
          <View style={styles.endedContainer}>
            <Text style={styles.endedIcon}>📞</Text>
            {/* ✅ AVANT: 'انتهت المكالمة' */}
            <Text style={styles.endedText}>{t('call.ended')}</Text>
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
