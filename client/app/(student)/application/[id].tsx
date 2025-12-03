import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/header';
import { scholarshipApplicationService } from '@/services/scholarship-application.service';

interface Application {
  scholarship_application_id: string;
  student_id: string;
  scholarship_id: string;
  status: 'pending' | 'shortlisted' | 'approved' | 'denied';
  remarks?: string;
  custom_form_response: Array<{ label: string; value: any }>;
  applied_at: string;
  updated_at: string;
  scholarship?: {
    scholarship_id: string;
    title: string;
    description: string;
    type?: string;
    purpose?: string;
    total_amount: number;
    total_slot: number;
    application_deadline?: string;
    criteria: string[];
    required_documents: string[];
    tags: string[];
    image_url?: string;
    sponsor: {
      sponsor_id: string;
      organization_name: string;
      user: {
        profile_url?: string;
      }
    };
  };
}

const statusIconMap = {
  pending: { name: 'time-outline', color: '#F7B801', label: 'Pending' },
  shortlisted: { name: 'star', color: '#a91cbfff', label: 'Shortlisted' },
  approved: { name: 'checkmark-circle-outline', color: '#31D0AA', label: 'Approved' },
  denied: { name: 'close-circle-outline', color: '#FF6B6B', label: 'Denied' },
};

const statusColorMap = {
  pending: '#FEF3C7',
  shortlisted: '#FFF4E5',
  approved: '#ECFDF5',
  denied: '#FEF2F2',
};

export default function ApplicationDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<Application | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const fetchApplicationDetails = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      setLoading(true);
      const res = await scholarshipApplicationService.getApplicationById(String(id));
      if (res.success && res.application) {
        setApplication(res.application);
      } else {
        setError(res.message || 'Failed to load application');
      }
    } catch (e) {
      setError('Failed to load application details');
      console.error('Error fetching application:', e);
    } finally {
      setLoading(false);
      animateIn();
    }
  }, [id, animateIn]);

  useEffect(() => {
    fetchApplicationDetails();
  }, [fetchApplicationDetails]);

  const formatAmount = (value?: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof num !== 'number' || isNaN(num)) return '₱0.00';
    return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatText = (text: string): string => {
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const isFileField = (value: any): boolean => {
    return Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && value[0].startsWith('http');
  };

  const handleFileOpen = async (url: string, fileName: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this file type');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const getFileNameFromUrl = (url: string, defaultName: string = 'File'): string => {
    try {
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      return fileName ? decodeURIComponent(fileName.split('?')[0]) : defaultName;
    } catch {
      return defaultName;
    }
  };

  const statusIcon = application ? statusIconMap[application.status] : null;
  const statusBgColor = application ? statusColorMap[application.status] : '#F0F7FF';
  const amountPerScholar = application?.scholarship?.total_slot && application.scholarship.total_slot > 0
    ? application.scholarship.total_amount / application.scholarship.total_slot
    : application?.scholarship?.total_amount || 0;

  return (
    <View style={styles.container}>
      <Header title="Application Details" showSearch={false} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3A52A6" />
          <Text style={styles.loadingText}>Loading application…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable 
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            onPress={fetchApplicationDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : application ? (
        <Animated.ScrollView
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Section */}
          <View style={[styles.statusBadgeContainer, { backgroundColor: statusBgColor }]}>
            <View style={styles.statusBadgeContent}>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusLabel}>Application Status</Text>
                <Text style={[styles.statusValue, { color: statusIcon?.color }]}>
                  {statusIcon?.label}
                </Text>
              </View>
            </View>
            {application.remarks && (
              <Text style={styles.remarksText}>{application.remarks}</Text>
            )}
          </View>

          {/* Scholarship Info Card */}
          {application.scholarship && (
            <>
              <View style={styles.imageCard}>
                <Image
                  source={
                    application.scholarship.image_url
                      ? { uri: application.scholarship.image_url }
                      : require('@/assets/images/iskolar-logo.png')
                  }
                  style={styles.scholarshipImage}
                  defaultSource={require('@/assets/images/iskolar-logo.png')}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.titleText}>{application.scholarship.title}</Text>
                <View style={styles.metaRow}>
                  <Image 
                    source={
                    application.scholarship.sponsor.user.profile_url 
                      ? { uri: application.scholarship.sponsor.user.profile_url } 
                      : require('@/assets/images/iskolar-logo.png')
                  }
                  style={styles.profileImage}
                  defaultSource={require('@/assets/images/iskolar-logo.png')}
                />
                  <Text style={styles.metaText}>
                    {application.scholarship.sponsor?.organization_name || 'Unknown Sponsor'}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>
                    Deadline: {formatDate(application.scholarship.application_deadline)}
                  </Text>
                </View>
              </View>

              {/* Scholarship Metrics */}
              <View style={styles.metricsRow}>
                <View style={[styles.metricBox, { borderColor: '#E5E7EB' }]}>
                  <Text style={styles.metricLabel}>Amount</Text>
                  <Text style={[styles.metricValue, { color: '#111827' }]}>
                    {formatAmount(amountPerScholar)}
                  </Text>
                  <Text style={styles.metricSubtext}>per scholar</Text>
                </View>
                <View style={[styles.metricBox, { borderColor: '#E5E7EB' }]}>
                  <Text style={styles.metricLabel}>Slots</Text>
                  <Text style={[styles.metricValue, { color: '#111827' }]}>
                    {application.scholarship.total_slot}
                  </Text>
                  <Text style={styles.metricSubtext}>available</Text>
                </View>
              </View>

              {/* Description */}
              {application.scholarship.description && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.bodyText}>{application.scholarship.description}</Text>
                </View>
              )}

              {/* Criteria */}
              {Array.isArray(application.scholarship.criteria) && application.scholarship.criteria.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Eligibility Criteria</Text>
                  <View style={styles.tagsContainer}>
                    {application.scholarship.criteria.map((c: string, idx: number) => (
                      <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>{formatText(c)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Required Documents */}
              {Array.isArray(application.scholarship.required_documents) &&
                application.scholarship.required_documents.length > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Required Documents</Text>
                    <View style={styles.tagsContainer}>
                      {application.scholarship.required_documents.map((d: string, idx: number) => (
                        <View key={idx} style={styles.tag}>
                          <Text style={styles.tagText}>{formatText(d)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
            </>
          )}

          {/* Your Application */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Application</Text>
            </View>

            {application.custom_form_response && application.custom_form_response.length > 0 ? (
              <View style={styles.formResponsesContainer}>
                {application.custom_form_response.map((response, index) => (
                  <View key={index} style={styles.formResponseItem}>
                    <Text style={styles.formLabel}>{response.label}</Text>
                    {isFileField(response.value) ? (
                      <View style={styles.filesContainer}>
                        {Array.isArray(response.value) ? (
                          response.value.map((fileUrl: string, idx: number) => {
                            const fileName = getFileNameFromUrl(fileUrl, `File ${idx + 1}`);
                            return (
                              <View key={idx} style={styles.fileItemContainer}>
                                <View style={styles.fileContent}>
                                  <Ionicons name="document-outline" size={16} color="#3A52A6" />
                                  <View style={styles.fileInfo}>
                                    <Text style={styles.fileName} numberOfLines={2}>
                                      {response.label}
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.fileActions}>
                                  <Pressable 
                                    style={styles.fileActionButton}
                                    onPress={() => handleFileOpen(fileUrl, fileName)}
                                    hitSlop={8}
                                  >
                                    <Ionicons name="open-outline" size={16} color="#111827" />
                                  </Pressable>
                                </View>
                              </View>
                            );
                          })
                        ) : (
                          <View style={styles.fileItemContainer}>
                            <View style={styles.fileContent}>
                              <Ionicons name="document-outline" size={16} color="#3A52A6" />
                              <View style={styles.fileInfo}>
                                <Text style={styles.fileName} numberOfLines={2}>
                                  Uploaded File
                                </Text>
                              </View>
                            </View>
                            <View style={styles.fileActions}>
                            <Pressable 
                              style={styles.fileActionButton}
                              onPress={() => handleFileOpen(response.value, 'File')}
                              hitSlop={8}
                            >
                              <Ionicons name="open-outline" size={16} color="#111827" />
                            </Pressable>
                            </View>
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.formValue}>
                        {Array.isArray(response.value)
                          ? response.value.join(', ')
                          : String(response.value || 'N/A')}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyResponseText}>No application responses provided</Text>
            )}
          </View>

          {/* Application Timeline */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <View style={styles.timelineContainer}>
              {/* Timeline Item: Applied */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Ionicons name="checkmark" size={16} color="#31D0AA" />
                  <View style={styles.timelineVerticalLine} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Applied</Text>
                  <Text style={styles.timelineDate}>{formatDateTime(application.applied_at)}</Text>
                </View>
              </View>
              {/* Timeline Item: Last Updated (last item, no line) */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Ionicons name="time-outline" size={16} color="#F7B801" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Last Updated</Text>
                  <Text style={styles.timelineDate}>{formatDateTime(application.updated_at)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Info Footer */}
          <View style={styles.infoFooter}>
            <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
            <Text style={styles.infoFooterText}>
              You cannot edit or delete this application.
            </Text>
          </View>

          <View style={{ height: 24 }} />
        </Animated.ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
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
  retryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  retryButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#F0F7FF',
  },

  // Status Section
  statusBadgeContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#3A52A6',
  },
  statusBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  statusValue: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    textTransform: 'capitalize',
  },
  remarksText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#5D6673',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Card Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  scholarshipImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F0F7FF',
    resizeMode: 'cover',
  },
  titleText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 22,
    color: '#111827',
    marginBottom: 12,
    lineHeight: 28,
  },
  profileImage: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
    resizeMode: 'cover',
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

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  metricLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
  },
  metricSubtext: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },

  // Section Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#5D6673',
    marginBottom: 8,
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
    backgroundColor: '#F9FAFB', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tagText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
    textTransform: 'capitalize',
  },

  // Form Responses
  formResponsesContainer: {
    gap: 16,
  },
  formResponseItem: {
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  formResponseItem_last: {
    borderBottomWidth: 0,
  },
  formLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#5D6673',
    marginBottom: 6,
  },
  formValue: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#111827',
    lineHeight: 20,
  },
  emptyResponseText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 14,
  },
  filesContainer: {
    gap: 8,
  },
  fileItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3A52A6',
  },
  fileContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  fileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
  },
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fileActionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#E0ECFF',
  },
  fileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3A52A6',
  },
  fileLinkText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#3A52A6',
    flex: 1,
  },

  // Timeline
  timelineContainer: {
    gap: 14,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftColor: '#E5E7EB',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: '50%',
    top: '100%',
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    transform: [{ translateX: -1 }],
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#5D6673',
    marginBottom: 2,
  },
  timelineDate: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
  },

  // Footer
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  infoFooterText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#78350F',
    flex: 1,
    lineHeight: 18,
  },
});
