// app/index.tsx
import { View, Text, Image, Pressable, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
  const router = useRouter();

  // Animation 
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(30)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo animation 
      Animated.parallel([
        Animated.timing(logoFade, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Header animation
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Tagline animation
      Animated.parallel([
        Animated.timing(taglineFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Button animation
      Animated.parallel([
        Animated.timing(buttonFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(buttonSlide, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#3A52A6', '#3A52A6', '#607EF2']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.container}
    >
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerFade,
            transform: [{ translateY: headerSlide }],
          }
        ]}
      >
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSubtitle}>Scholarships</Text>
      </Animated.View>

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Animated.Image 
            source={require('../assets/images/iskolar-logo.png')} 
            style={[
              styles.image,
              {
                opacity: logoFade,
                transform: [{ scale: logoScale }],
              }
            ]} 
          />

          {/* Tagline */}
          <Animated.View
            style={{
              opacity: taglineFade,
              transform: [{ translateY: taglineSlide }],
            }}
          >
            <Text style={styles.tagline}>
              Funding Education{'\n'}
              with <Text style={styles.taglineIntegrity}>Integrity</Text>
            </Text>
          </Animated.View>
        </View>

        {/* Get Started Button */}
        <Animated.View
          style={{
            opacity: buttonFade,
            transform: [{ translateY: buttonSlide }],
          }}
        >
          <Pressable
            onPress={() => router.replace('/login')}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 225,
    paddingTop: 80,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 32,
    color: '#F0F7FF',
  },
  headerSubtitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 32,
    color: '#F0F7FF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 75,
    paddingBottom: 90,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
  },
  image: {
    width: 250,
    height: 250,
  },
  tagline: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 24,
    textAlign: 'center',
    color: '#3A52A6',
    lineHeight: 28,
  },
  taglineIntegrity: {
    color: '#EFA508',
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 24,
  },
  button: {
    backgroundColor: '#EFA508',
    paddingVertical: 15,
    paddingHorizontal: 90,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#F0F7FF',
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});