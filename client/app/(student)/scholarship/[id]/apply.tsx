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
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import Header from '@/components/header';
import { scholarshipService, CustomFormField } from '@/services/scholarship.service';
import Toast from '@/components/toast';

type DocumentAsset = DocumentPicker.DocumentPickerAsset;

// Helper function to safely extract custom form fields
const getCustomFormFields = (scholarship: any): CustomFormField[] => {
  if (!scholarship?.custom_form_fields) {
    return [];
  }

  // If it's already an array, return it
  if (Array.isArray(scholarship.custom_form_fields)) {
    return scholarship.custom_form_fields;
  }

  // If it's a string, try to parse it
  if (typeof scholarship.custom_form_fields === 'string') {
    try {
      const parsed = JSON.parse(scholarship.custom_form_fields);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse custom_form_fields:', e);
      return [];
    }
  }

  // If it's an object with a fields property or similar
  if (typeof scholarship.custom_form_fields === 'object') {
    // Check if it has a fields property
    if (Array.isArray(scholarship.custom_form_fields.fields)) {
      return scholarship.custom_form_fields.fields;
    }
  }

  return [];
};

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
  
  // Custom form fields state
  const [customFormValues, setCustomFormValues] = useState<Record<string, any>>({});
  const [customFormFiles, setCustomFormFiles] = useState<Record<string, DocumentAsset[]>>({});
  const [datePickers, setDatePickers] = useState<Record<string, boolean>>({});

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
        console.log('Scholarship fetched:', res.scholarship);
        console.log('Custom form fields:', res.scholarship.custom_form_fields);
        console.log('Type:', typeof res.scholarship.custom_form_fields);
        console.log('Is array?:', Array.isArray(res.scholarship.custom_form_fields));
        setScholarship(res.scholarship);
      } else {
        setError(res.message || 'Failed to load scholarship');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load scholarship');
    } finally {
      setLoading(false);
      animateIn();
    }
  }, [id, animateIn]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

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
      showToast('error', 'Error', 'We could not find this scholarship. Please try again later.');
      return;
    }

    if (documents.length === 0) {
      showToast('error', 'Validation Error', 'Please add at least one document to continue.');
      return;
    }

    // Validate custom form fields
    const customFields = getCustomFormFields(scholarship);
    const validationErrors: string[] = [];

    customFields.forEach((field: CustomFormField, index: number) => {
      const fieldKey = `${field.label}-${index}`;
      
      if (field.required) {
        if (field.type === 'file') {
          const files = customFormFiles[fieldKey] || [];
          if (files.length === 0) {
            validationErrors.push(`${field.label} is required`);
          }
        } else if (field.type === 'checkbox') {
          const value = customFormValues[fieldKey];
          if (!Array.isArray(value) || value.length === 0) {
            validationErrors.push(`${field.label} requires at least one selection`);
          }
        } else {
          const value = customFormValues[fieldKey];
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            validationErrors.push(`${field.label} is required`);
          }
        }
      }
      
      // Type-specific validation (even if not required, validate format if filled)
      const value = customFormValues[fieldKey];
      
      if (value && typeof value === 'string' && value.trim() !== '') {
        switch (field.type) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value.trim())) {
              validationErrors.push(`${field.label} must be a valid email address`);
            }
            break;
          
          case 'phone':
            const phoneDigits = value.replace(/\D/g, '');
            const isValidPH = (
              (phoneDigits.length === 11 && phoneDigits.startsWith('09')) ||
              (phoneDigits.length === 12 && phoneDigits.startsWith('63')) ||
              (phoneDigits.length === 10 && phoneDigits.startsWith('02'))
            );
            if (!isValidPH) {
              validationErrors.push(`${field.label} must be a valid Philippine phone number (e.g., 09XX XXX XXXX)`);
            }
            break;
          
          case 'number':
            if (isNaN(Number(value))) {
              validationErrors.push(`${field.label} must be a valid number`);
            }
            break;
          
          case 'dropdown':
            if (field.options && !field.options.includes(value)) {
              validationErrors.push(`${field.label} has an invalid selection`);
            }
            break;
        }
      }
      
      // Validate checkbox options
      if (field.type === 'checkbox' && Array.isArray(value) && value.length > 0) {
        const invalidOptions = value.filter(v => !field.options?.includes(v));
        if (invalidOptions.length > 0) {
          validationErrors.push(`${field.label} contains invalid selections`);
        }
      }
    });

    if (validationErrors.length > 0) {
      // Show first 3 errors (to avoid overwhelming the user)
      const displayErrors = validationErrors.slice(0, 3);
      const errorMessage = displayErrors.join('\n') + 
        (validationErrors.length > 3 ? `\n... and ${validationErrors.length - 3} more` : '');
      showToast('error', 'Validation Error', errorMessage);
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      showToast('success', 'Success', 'Application form is ready. Submission endpoints will be available soon.');
      
      // Log the collected data for debugging
      console.log('Application Data:', {
        scholarshipId: id,
        documents: documents.map(d => ({ name: d.name, size: d.size, type: d.mimeType })),
        customFormValues: Object.entries(customFormValues).map(([key, value]) => ({
          field: key,
          value: Array.isArray(value) ? `[${value.join(', ')}]` : value
        })),
        customFormFiles: Object.keys(customFormFiles).map(key => ({
          field: key,
          files: customFormFiles[key].map(f => ({ name: f.name, size: f.size }))
        }))
      });
    }, 600);
  }, [documents, id, scholarship, customFormValues, customFormFiles]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Custom form field handlers
  const updateCustomFormValue = (fieldLabel: string, value: any) => {
    setCustomFormValues(prev => ({
      ...prev,
      [fieldLabel]: value,
    }));
  };

  const handleCustomFileUpload = useCallback(async (fieldLabel: string) => {
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

      setCustomFormFiles((prev) => {
        const existing = prev[fieldLabel] || [];
        const existingUris = new Set(existing.map((doc) => doc.uri));
        const next = [...existing];

        pickedAssets.forEach((asset) => {
          if (asset?.uri && !existingUris.has(asset.uri)) {
            next.push(asset);
            existingUris.add(asset.uri);
          }
        });

        return {
          ...prev,
          [fieldLabel]: next,
        };
      });
    } catch (err) {
      console.error('Document picking error:', err);
      showToast('error', 'Error', 'Failed to select file. Please try again.');
    }
  }, []);

  const removeCustomFile = (fieldLabel: string, uri: string) => {
    setCustomFormFiles(prev => ({
      ...prev,
      [fieldLabel]: (prev[fieldLabel] || []).filter((doc) => doc.uri !== uri),
    }));
  };

  const handleDateChange = (fieldLabel: string, event: any, selectedDate?: Date) => {
    // On Android, the picker closes automatically after selection
    if (Platform.OS === 'android') {
      setDatePickers(prev => ({ ...prev, [fieldLabel]: false }));
    }
    
    // Update the value if a date was selected
    if (selectedDate && event.type !== 'dismissed') {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      updateCustomFormValue(fieldLabel, formattedDate);
    }
  };

  // Render custom form field based on type
  const renderCustomFormField = (field: CustomFormField, index: number) => {
    const fieldKey = `${field.label}-${index}`;
    const value = customFormValues[fieldKey] || '';
    const files = customFormFiles[fieldKey] || [];
    const showDatePicker = datePickers[fieldKey] || false;

    return (
      <View key={fieldKey} style={styles.customFieldContainer}>
        <View style={styles.customFieldLabelContainer}>
          <Text style={styles.customFieldLabel}>
            {field.label}
            {field.required && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
        </View>

        {field.type === 'text' && (
          <TextInput
            style={styles.customFieldInput}
            value={value}
            onChangeText={(text) => updateCustomFormValue(fieldKey, text)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="#9CA3AF"
          />
        )}

        {field.type === 'textarea' && (
          <TextInput
            style={[styles.customFieldInput, styles.customFieldTextArea]}
            value={value}
            onChangeText={(text) => updateCustomFormValue(fieldKey, text)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        )}

        {field.type === 'number' && (
          <TextInput
            style={styles.customFieldInput}
            value={value}
            onChangeText={(text) => updateCustomFormValue(fieldKey, text)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        )}

        {field.type === 'date' && (
          <View>
            <Pressable
              style={styles.customFieldDateInput}
              onPress={() => setDatePickers(prev => ({ ...prev, [fieldKey]: true }))}
            >
              <MaterialIcons name="calendar-today" size={18} color="#6B7280" />
              <Text style={[styles.customFieldDateText, !value && styles.placeholderText]}>
                {value ? formatDate(value) : `Select ${field.label.toLowerCase()}`}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={value ? new Date(value) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => handleDateChange(fieldKey, event, date)}
              />
            )}
          </View>
        )}

        {field.type === 'dropdown' && field.options && (
          <Dropdown
            style={styles.customFieldDropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            iconStyle={styles.iconStyle}
            containerStyle={styles.dropdownContainer}
            itemContainerStyle={styles.itemContainer}
            itemTextStyle={styles.itemText}
            activeColor="#E0ECFF"
            data={field.options.map(opt => ({ label: opt, value: opt }))}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={`Select ${field.label.toLowerCase()}`}
            value={value}
            onChange={item => updateCustomFormValue(fieldKey, item.value)}
          />
        )}

        {field.type === 'file' && (
          <View>
            <Pressable
              style={styles.customFieldFileButton}
              onPress={() => handleCustomFileUpload(fieldKey)}
            >
              <Ionicons name="cloud-upload-outline" size={16} color="#3A52A6" />
              <Text style={styles.customFieldFileButtonText}>Upload File</Text>
            </Pressable>
            {files.length > 0 && (
              <View style={styles.customFieldFileList}>
                {files.map((file) => (
                  <View key={file.uri} style={styles.customFieldFileItem}>
                    <View style={styles.documentIconContainer}>
                      <Ionicons name="document-text-outline" size={18} color="#3A52A6" />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text numberOfLines={1} style={styles.documentName}>
                        {file.name || 'Untitled document'}
                      </Text>
                      <Text style={styles.documentMeta}>
                        {formatFileSize(file.size)} • {file.mimeType || 'Unknown type'}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => removeCustomFile(fieldKey, file.uri)}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {field.type === 'email' && (
          <TextInput
            style={styles.customFieldInput}
            value={value}
            onChangeText={(text) => updateCustomFormValue(fieldKey, text)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}

        {field.type === 'phone' && (
          <TextInput
            style={styles.customFieldInput}
            value={value}
            onChangeText={(text) => updateCustomFormValue(fieldKey, text)}
            placeholder="09XX XXX XXXX"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />
        )}

        {field.type === 'checkbox' && field.options && (
          <View>
            {field.options.map((option, optIndex) => {
              const selectedValues = Array.isArray(value) ? value : [];
              const isChecked = selectedValues.includes(option);
              
              return (
                <Pressable
                  key={optIndex}
                  style={styles.checkboxItem}
                  onPress={() => {
                    const currentValues = Array.isArray(value) ? [...value] : [];
                    if (isChecked) {
                      // Remove from array
                      const newValues = currentValues.filter(v => v !== option);
                      updateCustomFormValue(fieldKey, newValues);
                    } else {
                      // Add to array
                      updateCustomFormValue(fieldKey, [...currentValues, option]);
                    }
                  }}
                >
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && (
                      <MaterialIcons name="check" size={16} color="#F0F7FF" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const showFooter = !loading && !error;

  // Get custom form fields safely
  const customFields = getCustomFormFields(scholarship);

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
                {(scholarship?.criteria ?? []).map((criterion: string, idx: number) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{criterion.replace(/_/g, ' ')}</Text>
                  </View>
                ))}
                {(scholarship?.criteria?.length ?? 0) === 0 && (
                  <Text style={styles.emptyTagText}>No criteria were specified.</Text>
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

            {/* Custom Form Fields */}
            {customFields.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Student Information</Text>
                <Text style={styles.helperText}>
                  Please provide the following information requested.
                </Text>
                <View style={styles.customFieldsContainer}>
                  {customFields.map((field: CustomFormField, index: number) => 
                    renderCustomFormField(field, index)
                  )}
                </View>
              </View>
            )}

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
  },
  documentMeta: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#6B7280',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C4CBD5',
    backgroundColor: '#F6F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3A52A6',
    borderColor: '#3A52A6',
  },
  checkboxLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#111827',
    flex: 1,
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
  customFieldsContainer: {
    marginTop: 16,
    gap: 20,
  },
  customFieldContainer: {
    marginBottom: 4,
  },
  customFieldLabelContainer: {
    marginBottom: 8,
  },
  customFieldLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
  },
  requiredAsterisk: {
    color: '#EF4444',
  },
  customFieldInput: {
    fontFamily: 'BreeSerif_400Regular',
    backgroundColor: '#F6F9FF',
    borderWidth: 1,
    borderColor: '#E0ECFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 12,
    color: '#111827',
  },
  customFieldTextArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  customFieldDateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    backgroundColor: '#F6F9FF',
    borderWidth: 1,
    borderColor: '#E0ECFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  customFieldDateText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  customFieldDropdown: {
    backgroundColor: '#F6F9FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0ECFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  placeholderStyle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
  },
  selectedTextStyle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  dropdownContainer: {
    backgroundColor: '#F6F9FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0ECFF',
    shadowColor: '#3A52A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 4,
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
  },
  customFieldFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0ECFF',
    borderWidth: 1,
    borderColor: '#3A52A6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  customFieldFileButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#3A52A6',
  },
  customFieldFileList: {
    marginTop: 12,
    gap: 10,
  },
  customFieldFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F9FF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E0ECFF',
  },
});