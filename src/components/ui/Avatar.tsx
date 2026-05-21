
import React from 'react';
import { Image, StyleSheet, Text, View, ImageSourcePropType } from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';

interface AvatarProps {
  source?: ImageSourcePropType | string | null;
  fallbackText?: string;
  size?: number;
  style?: any;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  fallbackText,
  size = 40,
  style,
}) => {
  const { theme } = useTheme();
  const colors = getColors(theme);

  const renderSource = () => {
    if (!source) return null;
    if (typeof source === 'string') {
      return { uri: source };
    }
    return source;
  };

  const imageSource = renderSource();

  return (
    <View 
        style={[
            styles.container, 
            { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceSecondary }, 
            style
        ]}
    >
      {imageSource ? (
        <Image 
          source={imageSource} 
          style={{ width: '100%', height: '100%', borderRadius: size / 2 }} 
          resizeMode="cover"
        />
      ) : (
        <View style={styles.fallback}>
          <Text style={[styles.fallbackText, { color: colors.textSecondary, fontSize: size * 0.4 }]}>
            {fallbackText?.toUpperCase() || '??'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontWeight: 'bold',
  },
});
