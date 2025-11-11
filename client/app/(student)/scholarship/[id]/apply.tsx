import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Animated,
  Platform,
  TextInput,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Header from '@/components/header';
import { scholarshipService, CustomFormField } from '@/services/scholarship-creation.service';
import { scholarshipApplicationService } from '@/services/scholarship-application.service';
import Toast from '@/components/toast';

type DocumentAsset = DocumentPicker.DocumentPickerAsset;

// Helper function to safely extract custom form fields
const getCustomFormFields = (scholarship: any): CustomFormField[] => {
  if (!scholarship?.custom_form_fields) {
    return [];
  }

  if (Array.isArray(scholarship.custom_form_fields)) {
    return scholarship.custom_form_fields;
  }

  if (typeof scholarship.custom_form_fields === 'string') {
    try {
      const parsed = JSON.parse(scholarship.custom_form_fields);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse custom_form_fields:', e);
      return [];
    }
  }

  if (typeof scholarship.custom_form_fields === 'object') {
    if (Array.isArray(scholarship.custom_form_fields.fields)) {
      return scholarship.custom_form_fields.fields;
    }
  }

  return [];
};

const buildValidationSchema = (fields: CustomFormField[]) => {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field, index) => {
    const fieldKey = field.label;
    
    switch (field.type) {
      case 'text':
      case 'textarea':
        schemaObject[fieldKey] = field.required
          ? z.string().min(1, `${field.label} is required`)
          : z.string().optional();
        break;

      case 'email':
        schemaObject[fieldKey] = field.required
          ? z.string().min(1, `${field.label} is required`).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, `${field.label} must be a valid email`)
          : z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, `${field.label} must be a valid email`).optional().or(z.literal(''));
        break;

      case 'phone':
        const phoneValidation = z.string().refine((val) => {
          if (!val) return true;
          const phoneDigits = val.replace(/\D/g, '');
          return (
            (phoneDigits.length === 11 && phoneDigits.startsWith('09')) ||
            (phoneDigits.length === 12 && phoneDigits.startsWith('63')) ||
            (phoneDigits.length === 10 && phoneDigits.startsWith('02'))
          );
        }, `${field.label} must be a valid Philippine phone number`);
        
        schemaObject[fieldKey] = field.required
          ? phoneValidation.min(1, `${field.label} is required`)
          : phoneValidation.optional();
        break;

      case 'number':
        schemaObject[fieldKey] = field.required
          ? z.string().min(1, `${field.label} is required`).refine((val) => !isNaN(Number(val)), `${field.label} must be a valid number`)
          : z.string().refine((val) => !val || !isNaN(Number(val)), `${field.label} must be a valid number`).optional();
        break;

      case 'date':
        schemaObject[fieldKey] = field.required
          ? z.string().min(1, `${field.label} is required`)
          : z.string().optional();
        break;

      case 'dropdown':
        if (field.options && field.options.length > 0) {
          schemaObject[fieldKey] = field.required
            ? z.enum([field.options[0], ...field.options.slice(1)], { message: `${field.label} is required `})
            : z.enum([field.options[0], ...field.options.slice(1)]).optional().or(z.literal(''));
        } else {
          schemaObject[fieldKey] = field.required
            ? z.string().min(1, `${field.label} is required`)
            : z.string().optional();
        }
        break;

      case 'checkbox':
        if (field.options && field.options.length > 0) {
          const checkboxValidation = z.array(z.enum([field.options[0], ...field.options.slice(1)]));
          schemaObject[fieldKey] = field.required
            ? checkboxValidation.min(1, `${field.label} requires at least one selection`)
            : checkboxValidation.optional();
        } else {
          schemaObject[fieldKey] = field.required
            ? z.array(z.string()).min(1, `${field.label} requires at least one selection`)
            : z.array(z.string()).optional();
        }
        break;

      case 'file':
        // File validation is handled separately through customFormFiles state
        schemaObject[fieldKey] = z.any().optional();
        break;

      default:
        schemaObject[fieldKey] = field.required
          ? z.string().min(1, `${field.label} is required`)
          : z.string().optional();
    }
  });

  return z.object(schemaObject);
};

export default function ScholarshipApplyPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scholarship, setScholarship] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  
  // Custom form files state (managed separately from react-hook-form)
  const [customFormFiles, setCustomFormFiles] = useState<Record<string, DocumentAsset[]>>({});
  const [datePickers, setDatePickers] = useState<Record<string, boolean>>({});
  const [showSubmissionConfirmation, setShowSubmissionConfirmation] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<Record<string, any> | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Get custom form fields
  const customFields = getCustomFormFields(scholarship);

  // Initialize react-hook-form with dynamic schema
  const validationSchema = buildValidationSchema(customFields);
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(validationSchema),
    mode: 'onSubmit',
    defaultValues: customFields.reduce((acc, field, index) => {
      // Use only the label as the field key
      const fieldKey = field.label;
      acc[fieldKey] = field.type === 'checkbox' ? [] : '';
      return acc;
    }, {} as Record<string, any>),
  });

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToastType(type);
    setToastTitle(title);
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

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
        // Reset form when scholarship data is loaded
        const fields = getCustomFormFields(res.scholarship);
        const defaultValues = fields.reduce((acc, field, index) => {
          const fieldKey = field.label;
          acc[fieldKey] = field.type === 'checkbox' ? [] : '';
          return acc;
        }, {} as Record<string, any>);
        reset(defaultValues);
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
  }, [id, animateIn, reset]);

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

  const onSubmit = async (formData: Record<string, any>) => {
    // Show confirmation modal instead of proceeding directly
    setPendingSubmitData(formData);
    setShowSubmissionConfirmation(true);
  };

  const processSubmission = async (formData: Record<string, any>) => {
    if (!id) {
      showToast('error', 'Error', 'We could not find this scholarship. Please try again later.');
      setShowSubmissionConfirmation(false);
      return;
    }

    // Validate file fields 
    const fileValidationErrors: string[] = [];
    customFields.forEach((field: CustomFormField, index: number) => {
      const fieldKey = field.label;
      if (field.type === 'file' && field.required) {
        const files = customFormFiles[fieldKey] || [];
        if (files.length === 0) {
          fileValidationErrors.push(`${field.label} is required`);
        }
      }
    });

    if (fileValidationErrors.length > 0) {
      const errorMessage = fileValidationErrors.join('\n');
      showToast('error', 'Validation Error', errorMessage);
      setShowSubmissionConfirmation(false);
      return;
    }

    setSubmitting(true);
    setShowSubmissionConfirmation(false);

    try {
      const orderedResponseArray: Array<{ label: string; value: any }> = [];
      
      customFields.forEach((field: CustomFormField, index: number) => {
        const fieldKey = field.label;
        
        if (field.type === 'file') {
          orderedResponseArray.push({
            label: fieldKey,
            value: null, 
          });
        } else {
          orderedResponseArray.push({
            label: fieldKey,
            value: formData[fieldKey],
          });
        }
      });

      const submitResult = await scholarshipApplicationService.submitApplication(
        String(id),
        orderedResponseArray 
      );

      if (!submitResult.success) {
        showToast('error', 'Submission Failed', submitResult.message);
        setSubmitting(false);
        return;
      }

      const applicationId = submitResult.application?.scholarship_application_id;

      if (!applicationId) {
        showToast('error', 'Error', 'Application created but ID not returned. Please contact support.');
        setSubmitting(false);
        return;
      }

      // Upload files 
      const fileUploadPromises: Promise<any>[] = [];
      
      customFields.forEach((field: CustomFormField, index: number) => {
        const fieldKey = field.label;
        if (field.type === 'file') {
          const files = customFormFiles[fieldKey] || [];
          if (files.length > 0) {
            const mappedFiles = files.map(file => ({
              uri: file.uri,
              name: file.name || 'untitled',
              mimeType: file.mimeType || 'application/octet-stream',
              size: file.size,
            }));
            
            const uploadPromise = scholarshipApplicationService.uploadApplicationFiles(
              applicationId,
              fieldKey,
              mappedFiles
            );
            
            fileUploadPromises.push(uploadPromise);
          }
        }
      });

      if (fileUploadPromises.length > 0) {
        const uploadResults = await Promise.all(fileUploadPromises);
        const failedUploads = uploadResults.filter(result => !result.success);
        
        if (failedUploads.length > 0) {
          showToast(
            'error',
            'Upload Warning',
            `Application submitted but ${failedUploads.length} file upload(s) failed. Please contact support.`
          );
          setSubmitting(false);
          return;
        }
      }

      showToast('success', 'Success', 'Your application has been submitted!');
      
      setTimeout(() => {
        router.back();
      }, 1500);

    } catch (error) {
      console.error('Submission error:', error);
      showToast('error', 'Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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

  const handleDateChange = (fieldLabel: string, onChange: any, event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setDatePickers(prev => ({ ...prev, [fieldLabel]: false }));
    }
    
    if (selectedDate && event.type !== 'dismissed') {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      onChange(formattedDate);
    }
  };

  const renderCustomFormField = (field: CustomFormField, index: number) => {
    const fieldKey = field.label; 
    const files = customFormFiles[fieldKey] || [];
    const showDatePicker = datePickers[fieldKey] || false;
    const fieldError = errors[fieldKey];

    return (
      <View key={`${fieldKey}-${index}`} style={styles.customFieldContainer}>
        <View style={styles.customFieldLabelContainer}>
          <Text style={styles.customFieldLabel}>
            {field.label}
            {field.required && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
        </View>

        {field.type === 'text' && (
          <Controller
            control={control}
            name={fieldKey}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.customFieldInput, fieldError && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />
        )}

        {field.type === 'textarea' && (
          <Controller
            control={control}
            name={fieldKey}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.customFieldInput, styles.customFieldTextArea, fieldError && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            )}
          />
        )}

        {field.type === 'number' && (
          <Controller
            control={control}
            name={fieldKey}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.customFieldInput, fieldError && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            )}
          />
        )}

        {field.type === 'date' && (
          <Controller
            control={control}
            name={fieldKey}
            render={({ field: { onChange, value } }) => (
              <View>
                <Pressable
                  style={[styles.customFieldDateInput, fieldError && styles.inputError]}
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
                    onChange={(event, date) => handleDateChange(fieldKey, onChange, event, date)}
                  />
                )}
              </View>
            )}
          />
        )}

        {field.type === 'dropdown' && field.options && field.options.length > 0 && (
          <Controller
            control={control}
            name={fieldKey}
            render={({ field: { onChange, value } }) => (
              <Dropdown
                style={[styles.customFieldDropdown, fieldError && styles.inputError]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                iconStyle={styles.iconStyle}
                containerStyle={styles.dropdownContainer}
                itemContainerStyle={styles.itemContainer}
                itemTextStyle={styles.itemText}
                activeColor="#E0ECFF"
                data={(field.options || []).map(opt => ({ label: opt, value: opt }))}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={`Select ${field.label.toLowerCase()}`}
                value={value}
                onChange={item => onChange(item.value)}
              />
            )}
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
          <Controller
            control={control}
            name={fieldKey}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.customFieldInput, fieldError && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />
        )}

        {field.type === 'phone' && (
          <Controller
            control={control}
            name={fieldKey}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.customFieldInput, fieldError && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="09XX XXX XXXX"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            )}
          />
        )}

        {field.type === 'checkbox' && field.options && field.options.length > 0 && (
          <Controller
            control={control}
            name={fieldKey}
            render={({ field: { onChange, value } }) => (
              <View>
                {(field.options || []).map((option, optIndex) => {
                  const selectedValues = Array.isArray(value) ? value : [];
                  const isChecked = selectedValues.includes(option);
                  
                  return (
                    <Pressable
                      key={optIndex}
                      style={styles.checkboxItem}
                      onPress={() => {
                        const currentValues = Array.isArray(value) ? [...value] : [];
                        if (isChecked) {
                          const newValues = currentValues.filter(v => v !== option);
                          onChange(newValues);
                        } else {
                          onChange([...currentValues, option]);
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
          />
        )}

        {fieldError && (
          <Text style={styles.errorText}>{fieldError.message as string}</Text>
        )}
      </View>
    );
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
          <Text style={styles.errorTextMain}>{error}</Text>
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
                    submitting && styles.submitButtonDisabled,
                    pressed && !submitting && styles.submitButtonPressed
                  ]}
                  onPress={handleSubmit(onSubmit)}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#F0F7FF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </Pressable>
              </>
            )}

            <View style={{ height: 36 }} />
          </Animated.ScrollView>
        </View>
      )}
      
      {/* Submission Confirmation Modal */}
      <Modal
        visible={showSubmissionConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubmissionConfirmation(false)}
      >
        <View style={styles.submissionModalOverlay}>
          <View style={styles.submissionModalContent}>

            <Text style={styles.submissionModalTitle}>Submit Application?</Text>

            <Text style={styles.submissionModalMessage}>
              Please review your information before submitting. Once submitted, you cannot modify your application.
            </Text>

            <View style={styles.submissionModalButtons}>
              <TouchableOpacity 
                style={styles.submissionModalCancelButton}
                onPress={() => setShowSubmissionConfirmation(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.submissionModalCancelButtonText}>Review</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.submissionModalConfirmButton}
                onPress={() => {
                  if (pendingSubmitData) {
                    processSubmission(pendingSubmitData);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.submissionModalConfirmButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  errorTextMain: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#5D6673',
    marginTop: 14,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#EF4444',
    marginTop: 6,
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
    backgroundColor: '#D69407',
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#F0F7FF',
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
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
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
  submissionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  submissionModalContent: {
    backgroundColor: '#F0F7FF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  submissionModalTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#111827',
    marginBottom: 6,
    fontWeight: '600',
  },
  submissionModalMessage: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  submissionModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  submissionModalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(202, 205, 210, 1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submissionModalCancelButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  submissionModalConfirmButton: {
    flex: 1,
    backgroundColor: '#EFA508',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EFA508',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submissionModalConfirmButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});