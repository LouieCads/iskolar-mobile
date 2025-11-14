import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/header';
import { scholarshipService } from '@/services/scholarship-creation.service';
import { authService } from '@/services/auth.service';
import { scholarshipApplicationService } from '@/services/scholarship-application.service';
import Toast from '@/components/toast';

export default function ScholarshipDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scholarship, setScholarship] = useState<any>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('error');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef<any>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      setLoading(true);
      const res = await scholarshipService.getScholarshipById(String(id));
      if (res.success && res.scholarship) {
        setScholarship(res.scholarship);
      } else {
        setError(res.message);
      }
    } catch (e) {
      setError('Failed to load scholarship');
    } finally {
      setLoading(false);
      animateIn();
    }
  }, [id, animateIn]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const result = await authService.getProfileStatus();
        const role = result.user?.role;
        setIsStudent(role === 'student');
      } catch (err) {
        console.error('Error fetching user role for scholarship details:', err);
        setIsStudent(false);
      } finally {
        setRoleLoading(false);
      }
    };

    fetchRole();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const amountPerScholar = scholarship?.total_slot > 0
    ? scholarship.total_amount / scholarship.total_slot
    : scholarship?.total_amount;

  const formatAmount = (value?: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof num !== 'number' || isNaN(num)) return '₱ 0.00';
    return `₱ ${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isClosed = useCallback(() => {
    return scholarship?.status === 'closed';
  }, [scholarship?.status]);

  const handleApplyPress = useCallback(async () => {
    if (!id || !scholarship) return;
      
    // Check if user has already applied
    const res = await scholarshipApplicationService.checkApplicationExists(String(id));

    if (res.success && res.exists) {
      setToastType('error');
      setToastTitle('Already Applied');
      setToastMessage('You have already applied for this scholarship.');
      setToastVisible(true);

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => {
        setToastVisible(false);
      }, 3000);
      return;
    }

    // Check if scholarship is closed
    if (isClosed()) {
      setToastType('error');
      setToastTitle('Scholarship Closed');
      setToastMessage('This scholarship is no longer accepting applications.');
      setToastVisible(true);
      
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => {
        setToastVisible(false);
      }, 3000);
      return;
    }

    router.push({
      pathname: '/(student)/scholarship/[id]/apply',
      params: { id: String(id) },
    } as any);
    
  }, [id, scholarship, router, isClosed]);

  // Show Apply button only if not closed and user is a student
  const showApplyButton = !loading && !error && !roleLoading && isStudent && !isClosed();

  return (
    <View style={styles.container}>
      <Header
        title="Scholarship Details"
        showSearch={false}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3A52A6" />
          <Text style={styles.loadingText}>Loading details…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          <Animated.ScrollView
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            contentContainerStyle={[
              styles.scrollContent,
              showApplyButton && styles.scrollContentWithFooter,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.statusBadge}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: scholarship?.status === 'closed' ? '#FF6B6B' : '#31D0AA' }
              ]} />
              <Text style={[
                styles.statusText,
                { color: scholarship?.status === 'closed' ? '#FF6B6B' : '#31D0AA' }
              ]}>
                {scholarship?.status || 'Active'}
              </Text>
            </View>

            <View style={styles.heroCard}>
              <Image
                source={scholarship?.image_url ? { uri: scholarship.image_url } : require('@/assets/images/iskolar-logo.png')}
                style={styles.heroImage}
                defaultSource={require('@/assets/images/iskolar-logo.png')}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.titleText}>{scholarship?.title}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="business-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{scholarship?.sponsor?.organization_name || 'Unknown Sponsor'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>Deadline: {formatDate(scholarship?.application_deadline)}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.metricBox, { borderColor: '#31D0AA' }]}> 
                <Text style={styles.metricLabel}>Amount</Text>
                <Text style={[styles.metricValue, { color: '#31D0AA' }]}>{formatAmount(amountPerScholar)}</Text>
                <Text style={styles.perScholar}>per scholar</Text>
              </View>
              <View style={[styles.metricBox, { borderColor: '#607EF2' }]}> 
                <Text style={styles.metricLabel}>Slots</Text>
                <Text style={[styles.metricValue, { color: '#607EF2' }]}>{scholarship?.total_slot}</Text>
                <Text style={styles.perScholar}>available</Text>
              </View>
            </View>

            {scholarship?.description ? (
              <View style={styles.card}>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.bodyText}>{scholarship.description}</Text>
              </View>
            ) : null}

            {Array.isArray(scholarship?.criteria) && scholarship.criteria.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.label}>Eligibility Criteria</Text>
                <View style={styles.tagsContainer}>
                  {scholarship.criteria.map((c: string, idx: number) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{c.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {Array.isArray(scholarship?.required_documents) && scholarship.required_documents.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.label}>Required Documents</Text>
                <View style={styles.tagsContainer}>
                  {scholarship.required_documents.map((d: string, idx: number) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{d.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {showApplyButton && (
              <Pressable 
                style={({ pressed }) => [
                  styles.applyButton,
                  pressed && styles.applyButtonPressed
                ]} 
                onPress={handleApplyPress}
              >
                <Text style={styles.applyButtonText}>Apply Now</Text>
                <Ionicons name="arrow-forward" size={14} color="#F0F7FF" />
              </Pressable>
            )}

            {isClosed() && isStudent && (
              <View style={styles.closedBanner}>
                <Ionicons name="lock-closed" size={16} color="#DC2626" />
                <Text style={styles.closedBannerText}>
                  This scholarship is no longer accepting applications.
                </Text>
              </View>
            )}

            <View style={{ height: 24 }} />
          </Animated.ScrollView>
        </View>
      )}

      <Toast
        visible={toastVisible}
        type={toastType}
        title={toastTitle}
        message={toastMessage}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  contentWrapper: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  scrollContentWithFooter: {
    paddingBottom: 34,
  },
  loadingText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#5D6673',
    marginTop: 14,
  },
  errorText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#5D6673',
    marginTop: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3A52A6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#3A52A6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#F0F7FF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F0F7FF',
    resizeMode: 'cover',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  titleText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 22,
    color: '#111827',
    marginBottom: 6,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  metaText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  metricLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#5D6673',
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 18,
    marginTop: 4,
  },
  perScholar: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  label: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#5D6673',
    marginBottom: 6,
  },
  bodyText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12.5,
    color: '#111827',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0ECFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tagText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#3A52A6',
    textTransform: 'capitalize',
  },
  applyButton: {
    backgroundColor: '#3A52A6',
    borderRadius: 12,
    marginTop: 6,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#3A52A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  applyButtonPressed: {
    backgroundColor: '#2F4189',
    transform: [{ scale: 0.98 }],
  },
  applyButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#F0F7FF',
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    marginBottom: 20,
    gap: 10,
  },
  closedBannerText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#DC2626',
    flex: 1,
    lineHeight: 18,
  },
});