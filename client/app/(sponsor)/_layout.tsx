// (sponsor)/_layout.tsx
import { Stack } from 'expo-router';
import SponsorNav from '@/components/sponsor-nav';
import { View, StyleSheet } from 'react-native';

export default function Sponsor() {
  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="my-scholarships" />
        <Stack.Screen name="my-sponsor-profile" />
        <Stack.Screen name="scholarship/[id]" />
        <Stack.Screen name="scholarship/[id]/edit" />
      </Stack>
      <SponsorNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});