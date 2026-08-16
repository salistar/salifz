/**
 * Custom Hooks - Salifz
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard, Dimensions, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Audio } from 'expo-av';

// ============================================
// useDebounce
// ============================================
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// useKeyboard
// ============================================
export function useKeyboard() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return { keyboardVisible, keyboardHeight, dismissKeyboard: Keyboard.dismiss };
}

// ============================================
// useNetwork
// ============================================
export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [networkType, setNetworkType] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setNetworkType(state.type);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, networkType };
}

// ============================================
// useAppState
// ============================================
export function useAppState() {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const previousState = useRef<AppStateStatus>(appState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      previousState.current = appState;
      setAppState(nextAppState);
    });

    return () => subscription.remove();
  }, [appState]);

  return {
    appState,
    previousState: previousState.current,
    isActive: appState === 'active',
    isBackground: appState === 'background',
    isInactive: appState === 'inactive',
  };
}

// ============================================
// useLocalStorage
// ============================================
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadValue();
  }, [key]);

  const loadValue = async () => {
    try {
      const item = await AsyncStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  const removeValue = async () => {
    try {
      await AsyncStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  };

  return { value: storedValue, setValue, removeValue, loading };
}

// ============================================
// useScreenDimensions
// ============================================
export function useScreenDimensions() {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  return {
    width: dimensions.width,
    height: dimensions.height,
    isPortrait: dimensions.height > dimensions.width,
    isLandscape: dimensions.width > dimensions.height,
  };
}

// ============================================
// useTimer
// ============================================
export function useTimer(initialSeconds: number = 0, autoStart: boolean = false) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const formatTime = useCallback(() => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [seconds]);

  return { seconds, isRunning, start, pause, reset, formatTime };
}

// ============================================
// useCountdown
// ============================================
export function useCountdown(initialSeconds: number, onComplete?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, seconds, onComplete]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  return { seconds, isRunning, start, pause, reset, isComplete: seconds === 0 };
}

// ============================================
// useAudioPlayer
// ============================================
export function useAudioPlayer() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadAudio = async (uri: string) => {
    try {
      setIsLoading(true);
      
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      
      if (status.isLoaded) {
        setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
      }
    } catch (error) {
      console.error('Error loading audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis / 1000);
      setIsPlaying(status.isPlaying);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const play = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const pause = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const seek = async (seconds: number) => {
    if (sound) {
      await sound.setPositionAsync(seconds * 1000);
    }
  };

  const stop = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
      setPosition(0);
    }
  };

  return {
    loadAudio,
    play,
    pause,
    seek,
    stop,
    isPlaying,
    isLoading,
    duration,
    position,
  };
}

// ============================================
// usePagination
// ============================================
export function usePagination<T>(
  fetchFunction: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  limit: number = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadData = async (pageNum: number, refresh: boolean = false) => {
    if (loading) return;

    try {
      setLoading(true);
      if (refresh) setRefreshing(true);

      const result = await fetchFunction(pageNum, limit);
      
      if (refresh) {
        setData(result.data);
      } else {
        setData((prev) => [...prev, ...result.data]);
      }
      
      setTotal(result.total);
      setHasMore(data.length + result.data.length < result.total);
      setPage(pageNum);
    } catch (error) {
      console.error('Pagination error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => loadData(1, true);
  const loadMore = () => {
    if (hasMore && !loading) {
      loadData(page + 1);
    }
  };

  useEffect(() => {
    loadData(1);
  }, []);

  return {
    data,
    loading,
    refreshing,
    hasMore,
    total,
    refresh,
    loadMore,
  };
}

export default {
  useDebounce,
  useKeyboard,
  useNetwork,
  useAppState,
  useLocalStorage,
  useScreenDimensions,
  useTimer,
  useCountdown,
  useAudioPlayer,
  usePagination,
};
