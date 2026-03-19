import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color="#3A52A6" />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  box: {
    backgroundColor: '#F0F7FF',
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  message: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#4A5568',
  },
});
