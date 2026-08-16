/**
 * Input Component - Salifz
 * Champ de saisie réutilisable
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  isRTL?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  isRTL = false,
  secureTextEntry,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry !== undefined;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, isRTL && styles.rtlText]}>{label}</Text>
      )}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={error ? colors.error : isFocused ? colors.primary : colors.textMuted}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
        accessibilityLabel={label}
        accessibilityHint={error || undefined}
          {...props}
          style={[
            styles.input,
            leftIcon && { paddingLeft: 40 },
            (rightIcon || isPassword) && { paddingRight: 40 },
            isRTL && styles.rtlInput,
            inputStyle,
          ]}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={colors.textMuted}
        />
        
        {isPassword && (
          <TouchableOpacity accessible accessibilityRole="button"
            style={styles.rightIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
        
        {!isPassword && rightIcon && (
          <TouchableOpacity accessible accessibilityRole="button"
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={error ? colors.error : colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[styles.error, isRTL && styles.rtlText]}>{error}</Text>
      )}
      
      {hint && !error && (
        <Text style={[styles.hint, isRTL && styles.rtlText]}>{hint}</Text>
      )}
    </View>
  );
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    borderRadius: 12,
    backgroundColor: c.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputContainerFocused: {
    borderColor: c.primary,
    backgroundColor: c.surface,
  },
  inputContainerError: {
    borderColor: c.error,
    backgroundColor: '#FFF5F5',
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: c.text,
  },
  leftIcon: {
    position: 'absolute',
    left: 12,
    top: 15,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: 12,
    top: 15,
    zIndex: 1,
  },
  error: {
    fontSize: 12,
    color: c.error,
    marginTop: 4,
    marginLeft: 4,
  },
  hint: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 4,
    marginLeft: 4,
  },
  rtlText: {
    textAlign: 'right',
  },
  rtlInput: {
    textAlign: 'right',
  },
});

export default Input;
