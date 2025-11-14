// components/StudentNav.tsx
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import React, { useState } from 'react';
import { Octicons  } from '@expo/vector-icons';

export default function StudentNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeRoute, setActiveRoute] = useState<string | null>(pathname);

  const navItems = [
    { name: 'home', icon: 'home' as const, route: '/(student)/home' as const },
    { name: 'discover', icon: 'globe' as const, route: '/(student)/discover' as const },
    { name: 'profile', icon: 'person' as const, route: '/(student)/my-student-profile' as const },
  ];

  const isActive = (route: string) => activeRoute === route;

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const active = isActive(item.route);
        return (
          <Pressable
            key={item.name}
            style={[styles.navItem, active && styles.navItemActive]}
            onPress={() => {
              setActiveRoute(item.route);
              router.push(item.route);
            }}
          >
            <View style={styles.iconWrapper}>
              <Octicons
                name={item.icon}
                size={23}
                color={active ? '#3A52A6' : '#6B7280'}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  navItemActive: {
    backgroundColor: '#e0efffff',
    borderRadius: 50,
    padding: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});