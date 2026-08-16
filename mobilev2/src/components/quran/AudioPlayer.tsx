/**
 * AudioPlayer Component - Salifz
 * Lecteur audio pour les récitations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

interface AudioPlayerProps {
  surahName: string;
  ayahNumber?: number;
  reciterName: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isLoading?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onRepeat?: () => void;
  onSpeedChange?: () => void;
  repeatMode?: 'none' | 'one' | 'all';
  playbackSpeed?: number;
  variant?: 'full' | 'mini' | 'inline';
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  surahName,
  ayahNumber,
  reciterName,
  duration,
  currentTime,
  isPlaying,
  isLoading = false,
  onPlay,
  onPause,
  onSeek,
  onNext,
  onPrevious,
  onRepeat,
  onSpeedChange,
  repeatMode = 'none',
  playbackSpeed = 1.0,
  variant = 'full',
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRepeatIcon = (): string => {
    switch (repeatMode) {
      case 'one': return 'repeat';
      case 'all': return 'repeat';
      default: return 'repeat-outline';
    }
  };

  if (variant === 'mini') {
    return (
      <View style={styles.miniContainer}>
        <View style={styles.miniInfo}>
          <Text style={styles.miniTitle} numberOfLines={1}>
            {surahName} {ayahNumber ? `- Ayah ${ayahNumber}` : ''}
          </Text>
          <Text style={styles.miniReciter} numberOfLines={1}>{reciterName}</Text>
        </View>
        
        <TouchableOpacity accessible accessibilityRole="button"
          style={styles.miniPlayButton}
          onPress={isPlaying ? onPause : onPlay}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color={colors.onDeep}
          />
        </TouchableOpacity>
      </View>
    );
  }

  if (variant === 'inline') {
    return (
      <View style={styles.inlineContainer}>
        <TouchableOpacity accessible accessibilityRole="button"
          onPress={isPlaying ? onPause : onPlay}
          style={styles.inlinePlayButton}
        >
          <Ionicons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={40}
            color={colors.primary}
          />
        </TouchableOpacity>
        
        <View style={styles.inlineProgress}>
          <Slider
            style={styles.inlineSlider}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            onSlidingComplete={onSeek}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.inlineTimeRow}>
            <Text style={styles.inlineTime}>{formatTime(currentTime)}</Text>
            <Text style={styles.inlineTime}>{formatTime(duration)}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Track Info */}
      <View style={styles.trackInfo}>
        <Text style={styles.surahName}>{surahName}</Text>
        {ayahNumber && <Text style={styles.ayahNumber}>Ayah {ayahNumber}</Text>}
        <Text style={styles.reciterName}>{reciterName}</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.time}>{formatTime(currentTime)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={currentTime}
          onSlidingComplete={onSeek}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {onRepeat && (
          <TouchableOpacity accessible accessibilityRole="button" onPress={onRepeat} style={styles.controlButton}>
            <Ionicons
              name={getRepeatIcon() as any}
              size={24}
              color={repeatMode !== 'none' ? colors.primary : colors.textSecondary}
            />
            {repeatMode === 'one' && (
              <Text style={styles.repeatBadge}>1</Text>
            )}
          </TouchableOpacity>
        )}

        {onPrevious && (
          <TouchableOpacity accessible accessibilityRole="button" onPress={onPrevious} style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={28} color={colors.text} />
          </TouchableOpacity>
        )}

        <TouchableOpacity accessible accessibilityRole="button"
          style={styles.playButton}
          onPress={isPlaying ? onPause : onPlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <Ionicons name="hourglass-outline" size={32} color={colors.onDeep} />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color={colors.onDeep}
            />
          )}
        </TouchableOpacity>

        {onNext && (
          <TouchableOpacity accessible accessibilityRole="button" onPress={onNext} style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={28} color={colors.text} />
          </TouchableOpacity>
        )}

        {onSpeedChange && (
          <TouchableOpacity accessible accessibilityRole="button" onPress={onSpeedChange} style={styles.controlButton}>
            <Text style={styles.speedText}>{playbackSpeed}x</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  surahName: {
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
  },
  ayahNumber: {
    fontSize: 14,
    color: c.primary,
    marginTop: 4,
  },
  reciterName: {
    fontSize: 14,
    color: c.textMuted,
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  time: {
    fontSize: 12,
    color: c.textMuted,
    minWidth: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 12,
    position: 'relative',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  repeatBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 10,
    fontWeight: '700',
    color: c.primary,
  },
  speedText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textSecondary,
  },
  // Mini variant
  miniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  miniInfo: {
    flex: 1,
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
  miniReciter: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2,
  },
  miniPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Inline variant
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlinePlayButton: {
    marginRight: 12,
  },
  inlineProgress: {
    flex: 1,
  },
  inlineSlider: {
    width: '100%',
    height: 20,
  },
  inlineTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inlineTime: {
    fontSize: 10,
    color: c.textMuted,
  },
});

export default AudioPlayer;
