/**
 * Face Verification Screen - Salifz
 * Gender detection for Women's Space access
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';

export default function FaceVerificationScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const cameraRef = useRef<CameraView>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const captureAndVerify = async () => {
    if (!cameraRef.current) return;
    
    setIsProcessing(true);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      
      if (!photo) {
        throw new Error('Failed to capture photo');
      }
      
      // Send to backend for gender detection
      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'face.jpg',
      } as any);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/face/detect-gender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setVerificationResult(result.data);
        
        // Update user profile
        if (result.data.womensSpaceAccess) {
          await updateUser({
            profile: {
              ...user?.profile,
              detectedGender: result.data.gender,
              genderVerified: true,
              womensSpaceAccess: true,
            }
          });
          
          // Show success and navigate to women's space
          Alert.alert(
            t('faceVerification.success'),
            result.data.message?.[i18n.language] || result.data.message?.en,
            [
              {
                text: t('common.continue'),
                onPress: () => router.replace('/(women)/dashboard'),
              },
            ]
          );
        } else {
          Alert.alert(
            t('faceVerification.verified'),
            t('faceVerification.maleDetected'),
            [
              {
                text: t('common.ok'),
                onPress: () => router.back(),
              },
            ]
          );
        }
      } else {
        Alert.alert(t('common.error'), result.error || t('faceVerification.failed'));
      }
    } catch (error) {
      console.error('Face verification error:', error);
      Alert.alert(t('common.error'), t('faceVerification.failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color="#9CA3AF" />
          <Text style={[styles.permissionTitle, isRTL && styles.rtlText]}>
            {t('faceVerification.cameraPermission')}
          </Text>
          <Text style={[styles.permissionText, isRTL && styles.rtlText]}>
            {t('faceVerification.cameraPermissionDesc')}
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => Camera.requestCameraPermissionsAsync()}
          >
            <Text style={styles.permissionButtonText}>
              {t('faceVerification.grantPermission')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      >
        {/* Header */}
        <SafeAreaView style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons 
              name={isRTL ? 'chevron-forward' : 'chevron-back'} 
              size={28} 
              color="white" 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>
            {t('faceVerification.title')}
          </Text>
          <View style={{ width: 44 }} />
        </SafeAreaView>

        {/* Face Guide Overlay */}
        <View style={styles.overlay}>
          <View style={styles.faceGuide}>
            <View style={styles.faceGuideInner} />
          </View>
          <Text style={[styles.guideText, isRTL && styles.rtlText]}>
            {t('faceVerification.positionFace')}
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <Text style={[styles.infoText, isRTL && styles.rtlText]}>
              {t('faceVerification.womensSpaceInfo')}
            </Text>
            
            <TouchableOpacity
              style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
              onPress={captureAndVerify}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <View style={styles.captureButtonInner}>
                  <Ionicons name="scan" size={32} color="white" />
                </View>
              )}
            </TouchableOpacity>
            
            <Text style={[styles.captureText, isRTL && styles.rtlText]}>
              {isProcessing ? t('faceVerification.processing') : t('faceVerification.tapToVerify')}
            </Text>
          </LinearGradient>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 250,
    height: 320,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  faceGuideInner: {
    width: 230,
    height: 300,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  guideText: {
    marginTop: 20,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  gradient: {
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  captureButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureText: {
    marginTop: 12,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#111827',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  rtlText: {
    textAlign: 'right',
  },
});
