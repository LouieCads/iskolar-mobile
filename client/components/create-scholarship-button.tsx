import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

interface CreateScholarshipButtonProps {
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  backgroundColor?: string;
  bottom?: number;
  right?: number;
  size?: number;
}

export default function CreateScholarshipButton({
  onPress,
  iconName = 'add',
  iconSize = 25,
  iconColor = '#F0F7FF',
  backgroundColor = '#EFA508',
  bottom = 68,
  right = 14,
  size = 54,
}: CreateScholarshipButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  return (
    <Pressable
      style={[
        styles.createScholarshipButton,
        {
          bottom,
          right,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isPressed ? adjustBrightness(backgroundColor, -20) : backgroundColor,
          opacity: isPressed ? 0.85 : 1,
        },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
    </Pressable>
  );
}

// Helper function to adjust color brightness for pressed state
function adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16)
    .slice(1);
}

const styles = StyleSheet.create({
  createScholarshipButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});