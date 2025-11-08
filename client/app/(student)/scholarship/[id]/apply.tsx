import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Header from '@/components/header';
import { scholarshipService } from '@/services/scholarship.service';
import Toast from '@/components/toast';

type DocumentAsset = DocumentPicker.DocumentPickerAsset;

export default function ScholarshipApplyPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scholarship, setScholarship] = useState<any>(null);
  const [documents, setDocuments] = useState<DocumentAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToastType(type);
    setToastTitle(title);
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      setLoading(true);
      const res = await scholarshipService.getScholarshipById(String(id));
      if (res.success && res.scholarship) {
        setScholarship(res.scholarship);
      } else {
        setError(res.message || 'Failed to load scholarship');
      }
    } catch (err) {
      setError('Failed to load scholarship');
    } finally {
      setLoading(false);
      animateIn();
    }
  }, [id, animateIn]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleAddDocuments = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const pickedAssets: DocumentAsset[] = Array.isArray(result.assets)
        ? result.assets
        : [];

      setDocuments((prev) => {
        const existingUris = new Set(prev.map((doc) => doc.uri));
        const next = [...prev];

        pickedAssets.forEach((asset) => {
          if (asset?.uri && !existingUris.has(asset.uri)) {
            next.push(asset);
            existingUris.add(asset.uri);
          }
        });

        return next;
      });
    } catch (err) {
      console.error('Document picking error:', err);
      Alert.alert('Document Selection Failed', 'We could not access your files. Please try again.');
    }
  }, []);

  const handleRemoveDocument = useCallback((uri: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.uri !== uri));
  }, []);

  const formatFileSize = (size?: number | null) => {
    if (!size || size <= 0) return 'Unknown size';
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (size >= 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${size} B`;
  };

  const handleSubmit = useCallback(() => {
    if (!id) {
      Alert.alert('Missing Scholarship', 'We could not find this scholarship. Please try again later.');
      return;
    }

    if (documents.length === 0) {
      Alert.alert('No Documents Added', 'Please add at least one document to continue.');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        'Application Ready',
        'Your documents are ready to be uploaded. Submission endpoints will be available soon.'
      );
    }, 600);
  }, [documents, id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const showFooter = !loading && !error;

  return (
    <View style={styles.container}>
      <Header title="Application" showSearch={false} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3A52A6" />
          <Text style={styles.loadingText}>Preparing application form…</Text>
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
            style={{ opacity: fadeAnim }}
            contentContainerStyle={[styles.scrollContent, showFooter && styles.scrollContentWithFooter]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={styles.scholarshipTitle}>{scholarship?.title}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="business-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{scholarship?.sponsor?.organization_name || 'Unknown Sponsor'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>Deadline: {formatDate(scholarship?.application_deadline)}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Criteria</Text>
              <View style={styles.tagsContainer}>
                {(scholarship?.criteria ?? []).map((doc: string, idx: number) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{doc.replace(/_/g, ' ')}</Text>
                  </View>
                ))}
                {(scholarship?.required_documents?.length ?? 0) === 0 && (
                  <Text style={styles.emptyTagText}>No required documents were specified.</Text>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Required Documents</Text>
              <View style={styles.tagsContainer}>
                {(scholarship?.required_documents ?? []).map((doc: string, idx: number) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{doc.replace(/_/g, ' ')}</Text>
                  </View>
                ))}
                {(scholarship?.required_documents?.length ?? 0) === 0 && (
                  <Text style={styles.emptyTagText}>No required documents were specified.</Text>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.sectionTitle}>Upload Documents</Text>
                  <Text style={styles.helperText}>Accepted: PDF, images, and common document types up to 10MB each.</Text>
                </View>
                <Pressable 
                  style={({ pressed }) => [
                    styles.addButton,
                    pressed && styles.addButtonPressed
                  ]} 
                  onPress={handleAddDocuments}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color="#F0F7FF" />
                  <Text style={styles.addButtonText}>Add Files</Text>
                </Pressable>
              </View>

              {documents.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyStateIconContainer}>
                    <Ionicons name="document-outline" size={26} color="#3A52A6" />
                  </View>
                  <Text style={styles.emptyStateTitle}>No documents selected</Text>
                  <Text style={styles.emptyStateText}>Tap "Add Files" to attach your requirements.</Text>
                </View>
              ) : (
                <View style={styles.documentList}>
                  {documents.map((doc) => (
                    <View key={doc.uri} style={styles.documentItem}>
                      <View style={styles.documentIconContainer}>
                        <Ionicons name="document-text-outline" size={18} color="#3A52A6" />
                      </View>
                      <View style={styles.documentInfo}>
                        <Text numberOfLines={1} style={styles.documentName}>{doc.name || 'Untitled document'}</Text>
                        <Text style={styles.documentMeta}>{formatFileSize(doc.size)} • {doc.mimeType || 'Unknown type'}</Text>
                      </View>
                      <Pressable 
                        style={({ pressed }) => [
                          styles.removeButton,
                          pressed && styles.removeButtonPressed
                        ]} 
                        onPress={() => handleRemoveDocument(doc.uri)}
                      >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {showFooter && (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.submitButton,
                    (submitting || documents.length === 0) && styles.submitButtonDisabled,
                    pressed && !submitting && documents.length > 0 && styles.submitButtonPressed
                  ]}
                  onPress={handleSubmit}
                  disabled={submitting || documents.length === 0}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#F0F7FF" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Submit</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}

            <View style={{ height: 36 }} />
          </Animated.ScrollView>

          {/* Toast */}
          <Toast
            visible={toastVisible}
            type={toastType}
            title={toastTitle}
            message={toastMessage}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  scrollContentWithFooter: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 2,
  },
  scholarshipTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 20,
    color: '#3A52A6',
    marginBottom: 4,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  metaText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  helperText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 19,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0ECFF',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  tagIcon: {
    marginTop: -1,
  },
  tagText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#3A52A6',
    textTransform: 'capitalize',
  },
  emptyTagText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardHeaderText: {
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#3A52A6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#3A52A6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonPressed: {
    backgroundColor: '#2F4189',
    transform: [{ scale: 0.98 }],
  },
  addButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#F0F7FF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#F6F9FF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0ECFF',
    borderStyle: 'dashed',
  },
  emptyStateIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 40,
    backgroundColor: '#E0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#3A52A6',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  documentList: {
    gap: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F9FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E0ECFF',
  },
  documentIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 22,
    backgroundColor: '#E0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
    fontWeight: '500',
  },
  documentMeta: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#6B7280',
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  removeButtonPressed: {
    opacity: 0.6,
  },
  submitButton: {
    backgroundColor: '#EFA508',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EFA508',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  submitButtonPressed: {
    backgroundColor: '#2F4189',
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#F0F7FF',
  },
  footerHint: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
});