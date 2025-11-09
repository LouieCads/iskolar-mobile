import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, TextInput, Alert, Animated, Platform, Image, Modal } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { scholarshipService, CustomFormField } from '@/services/scholarship.service';
import Toast from '@/components/toast';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Dropdown } from 'react-native-element-dropdown';

export default function EditScholarshipPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [totalSlot, setTotalSlot] = useState('');
  const [deadline, setDeadline] = useState('');
  const [criteria, setCriteria] = useState('');
  const [documents, setDocuments] = useState('');
  const [type, setType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [status, setStatus] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Custom form fields state
  const [customFormFields, setCustomFormFields] = useState<CustomFormField[]>([]);
  const [showCustomFormModal, setShowCustomFormModal] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [newFieldType, setNewFieldType] = useState<'text' | 'textarea' | 'dropdown' | 'checkbox' | 'number' | 'date' | 'email' | 'phone' | 'file'>('text');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [dropdownOptionInput, setDropdownOptionInput] = useState('');

  const typeDropdownRotation = useRef(new Animated.Value(0)).current;
  const typeDropdownScale = useRef(new Animated.Value(1)).current;
  const purposeDropdownRotation = useRef(new Animated.Value(0)).current;
  const purposeDropdownScale = useRef(new Animated.Value(1)).current;
  const statusDropdownRotation = useRef(new Animated.Value(0)).current;
  const statusDropdownScale = useRef(new Animated.Value(1)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToastType(type);
    setToastTitle(title);
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
        return 'text-fields';
      case 'textarea':
        return 'subject';
      case 'number':
        return 'numbers';
      case 'email':
        return 'email';
      case 'phone':
        return 'phone';
      case 'date':
        return 'calendar-today';
      case 'dropdown':
        return 'arrow-drop-down-circle';
      case 'checkbox':
        return 'check-box';
      case 'file':
        return 'attach-file';
      default:
        return 'help-outline';
    }
  };

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      setLoading(true);
      const res = await scholarshipService.getScholarshipById(String(id));
      if (res.success && res.scholarship) {
        const s = res.scholarship as any;
        setTitle(s.title || '');
        setDescription(s.description || '');
        setTotalAmount(String(s.total_amount ?? ''));
        setTotalSlot(String(s.total_slot ?? ''));
        setDeadline(s.application_deadline ? String(s.application_deadline) : '');
        setCriteria(Array.isArray(s.criteria) ? s.criteria.join(',') : '');
        setDocuments(Array.isArray(s.required_documents) ? s.required_documents.join(',') : '');
        setType(s.type || '');
        setPurpose(s.purpose || '');
        setStatus(s.status || '');
        setImageUrl(s.image_url || null);
        setCustomFormFields(s.custom_form_fields || []);
        if (s.application_deadline) setDate(new Date(s.application_deadline));
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

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  const onSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      
      if (newImageUri) {
        const upload = await scholarshipService.uploadScholarshipImage(
          String(id), 
          newImageUri
        );
        
        if (!upload.success) {
          Alert.alert('Error', upload.message || 'Failed to upload image');
          setSaving(false);
          return;
        }
      }
      
      const payload: any = {
        title,
        description,
        total_amount: totalAmount ? Number(totalAmount) : undefined,
        total_slot: totalSlot ? Number(totalSlot) : undefined,
        application_deadline: deadline || undefined,
        criteria: criteria ? criteria.split(',').map(s => s.trim()) : undefined,
        required_documents: documents ? documents.split(',').map(s => s.trim()) : undefined,
        type: type || undefined,
        purpose: purpose || undefined,
        status: status || undefined,
        custom_form_fields: customFormFields.length > 0 ? customFormFields : undefined,
      };
      
      const res = await scholarshipService.updateScholarship(String(id), payload);
      if (res.success) {
        showToast('success', 'Success', 'Scholarship updated successfully!');
        setNewImageUri(null);
      } else {
        Alert.alert('Error', res.message);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Custom form field handlers
  const openCustomFormModal = (index?: number) => {
    if (index !== undefined) {
      const field = customFormFields[index];
      setEditingFieldIndex(index);
      setNewFieldType(field.type);
      setNewFieldLabel(field.label);
      setNewFieldRequired(field.required);
      setDropdownOptions(field.options || []);
      setDropdownOptionInput('');
    } else {
      setEditingFieldIndex(null);
      setNewFieldType('text');
      setNewFieldLabel('');
      setNewFieldRequired(false);
      setDropdownOptions([]);
      setDropdownOptionInput('');
    }
    setShowCustomFormModal(true);
  };

  const closeCustomFormModal = () => {
    setShowCustomFormModal(false);
    setEditingFieldIndex(null);
    setNewFieldType('text');
    setNewFieldLabel('');
    setNewFieldRequired(false);
    setDropdownOptions([]);
    setDropdownOptionInput('');
  };

  const addDropdownOption = () => {
    const trimmed = dropdownOptionInput.trim();
    if (trimmed && !dropdownOptions.includes(trimmed)) {
      setDropdownOptions([...dropdownOptions, trimmed]);
      setDropdownOptionInput('');
    }
  };

  const removeDropdownOption = (index: number) => {
    setDropdownOptions(dropdownOptions.filter((_, i) => i !== index));
  };

  const saveCustomFormField = () => {
    if (!newFieldLabel.trim()) {
      showToast('error', 'Validation Error', 'Please enter a field label');
      return;
    }

    if ((newFieldType === 'dropdown' || newFieldType === 'checkbox') && dropdownOptions.length === 0) {
      showToast('error', 'Validation Error', `Please add at least one ${newFieldType === 'checkbox' ? 'checkbox' : 'dropdown'} option`);
      return;
    }

    const newField: CustomFormField = {
      type: newFieldType,
      label: newFieldLabel.trim(),
      required: newFieldRequired,
      ...((newFieldType === 'dropdown' || newFieldType === 'checkbox') && { options: dropdownOptions }),
    };

    if (editingFieldIndex !== null) {
      setCustomFormFields(customFormFields.map((field, index) => 
        index === editingFieldIndex ? newField : field
      ));
    } else {
      setCustomFormFields([...customFormFields, newField]);
    }

    closeCustomFormModal();
  };

  const removeCustomFormField = (index: number) => {
    setCustomFormFields(customFormFields.filter((_, i) => i !== index));
  };

  const typeItems = [
    { label: 'Merit-Based', value: 'merit_based' },
    { label: 'Skill-Based', value: 'skill_based' },
  ];

  const purposeItems = [
    { label: 'Allowance', value: 'allowance' },
    { label: 'Tuition', value: 'tuition' },
  ];

  const statusItems = [
    { label: 'Active', value: 'active' },
    { label: 'Closed', value: 'closed' },
    { label: 'Archive', value: 'archived' },
  ];

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setDeadline(formattedDate);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const typeIconRotate = typeDropdownRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const purposeIconRotate = purposeDropdownRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const statusIconRotate = statusDropdownRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Gallery permission is required to select photos');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setNewImageUri(asset.uri);
        setImageUrl(asset.uri);
      }
    } catch (e) {
      console.error('Image picker error:', e);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toastVisible}
        type={toastType}
        title={toastTitle}
        message={toastMessage}
      />
      
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#F0F7FF" />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>Edit Scholarship</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3A52A6" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <Animated.ScrollView style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { marginBottom: 12 }]}>
            <Pressable onPress={pickImage}>
              <View style={styles.imageRow}>
                <Image
                  source={imageUrl ? { uri: imageUrl } : require('@/assets/images/iskolar-logo.png')}
                  style={styles.image}
                  defaultSource={require('@/assets/images/iskolar-logo.png')}
                />
                <Pressable style={styles.changeImageBtn} onPress={pickImage}>
                  <Ionicons name="camera" size={14} color="#F0F7FF" />
                </Pressable>
              </View>
            </Pressable>
          </View>
          <View style={styles.card}>
            <LabeledInput label="Title" value={title} onChangeText={setTitle} placeholder="Scholarship title" />
            <LabeledInput label="Description" value={description} onChangeText={setDescription} placeholder="Brief description" multiline />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <LabeledInput label="Amount (₱)" value={totalAmount} onChangeText={setTotalAmount} keyboardType="numeric" placeholder="0.00" />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <LabeledInput label="Slots" value={totalSlot} onChangeText={setTotalSlot} keyboardType="numeric" placeholder="0" />
              </View>
            </View>
            
            <Text style={styles.label}>Application Deadline</Text>
            <Pressable style={styles.dateInputContainer} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateInputText}>{deadline ? formatDate(deadline) : 'Set application deadline'}</Text>
              <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            </Pressable>
            {showDatePicker && (
              <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onChangeDate} minimumDate={new Date()} />
            )}

            <LabeledInput label="Criteria (comma-separated)" value={criteria} onChangeText={setCriteria} placeholder="example: senior_high,stem" />
            <LabeledInput label="Required Documents (comma-separated)" value={documents} onChangeText={setDocuments} placeholder="example: id,form_137" />

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Type</Text>
                <Animated.View style={{ transform: [{ scale: typeDropdownScale }] }}>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    iconStyle={styles.iconStyle}
                    containerStyle={styles.dropdownContainer}
                    itemContainerStyle={styles.itemContainer}
                    itemTextStyle={styles.itemText}
                    activeColor="#E0ECFF"
                    data={typeItems}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Select type"
                    value={type}
                    onChange={item => { setType(item.value); }}
                    renderRightIcon={() => (
                      <Animated.View style={{ transform: [{ rotate: typeIconRotate }] }}>
                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                      </Animated.View>
                    )}
                  />
                </Animated.View>
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Purpose</Text>
                <Animated.View style={{ transform: [{ scale: purposeDropdownScale }] }}>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    iconStyle={styles.iconStyle}
                    containerStyle={styles.dropdownContainer}
                    itemContainerStyle={styles.itemContainer}
                    itemTextStyle={styles.itemText}
                    activeColor="#E0ECFF"
                    data={purposeItems}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Select purpose"
                    value={purpose}
                    onChange={item => { setPurpose(item.value); }}
                    renderRightIcon={() => (
                      <Animated.View style={{ transform: [{ rotate: purposeIconRotate }] }}>
                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                      </Animated.View>
                    )}
                  />
                </Animated.View>
              </View>
            </View>

            <Text style={styles.label}>Status</Text>
            <Animated.View style={{ transform: [{ scale: statusDropdownScale }] }}>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                iconStyle={styles.iconStyle}
                containerStyle={styles.dropdownContainer}
                itemContainerStyle={styles.itemContainer}
                itemTextStyle={styles.itemText}
                activeColor="#E0ECFF"
                data={statusItems}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select status"
                value={status}
                onChange={item => { setStatus(item.value); }}
                renderRightIcon={() => (
                  <Animated.View style={{ transform: [{ rotate: statusIconRotate }] }}>
                    <Ionicons name="chevron-down" size={18} color="#6B7280" />
                  </Animated.View>
                )}
              />
            </Animated.View>

            {/* Custom Form Fields Section */}
            <View style={styles.customFormSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Application Form</Text>
                <Text style={styles.helperText}>Edit fields for applicants</Text>
              </View>
              
              {customFormFields.length > 0 && (
                <View style={styles.customFieldsList}>
                  {customFormFields.map((field, index) => (
                    <View key={index} style={styles.customFieldItem}>
                      <View style={styles.fieldIconContainer}>
                        <MaterialIcons 
                          name={getFieldIcon(field.type)} 
                          size={20} 
                          color="#3A52A6" 
                        />
                      </View>
                      <View style={styles.customFieldInfo}>
                        <View style={styles.customFieldHeader}>
                          <Text style={styles.customFieldLabel}>{field.label}</Text>
                          {field.required && (
                            <View style={styles.requiredBadge}>
                              <Text style={styles.requiredBadgeText}>Required</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.customFieldType}>
                          {field.type === 'dropdown' 
                            ? `Dropdown (${field.options?.length || 0} options)`
                            : field.type === 'checkbox'
                            ? `Checkbox (${field.options?.length || 0} options)`
                            : field.type === 'phone'
                            ? 'Phone number'
                            : field.type === 'text'
                            ? 'Short answer'
                            : field.type === 'textarea'
                            ? 'Long answer'
                            : field.type.charAt(0).toUpperCase() + field.type.slice(1).replace('_', ' ')
                          }
                        </Text>
                      </View>
                      <View style={styles.customFieldActions}>
                        <Pressable 
                          style={styles.editFieldButton}
                          onPress={() => openCustomFormModal(index)}
                        >
                          <MaterialIcons name="edit" size={16} color="#3A52A6" />
                        </Pressable>
                        <Pressable 
                          style={styles.removeFieldButton}
                          onPress={() => removeCustomFormField(index)}
                        >
                          <MaterialIcons name="delete" size={16} color="#EF4444" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <Pressable 
                style={styles.addCustomFieldButton}
                onPress={() => openCustomFormModal()}
              >
                <MaterialIcons name="add-circle-outline" size={20} color="#3A52A6" />
                <Text style={styles.addCustomFieldText}>
                  {customFormFields.length === 0 
                    ? 'Add Custom Form Field' 
                    : 'Add Another Field'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={onSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#F0F7FF" /> : <>
              <Ionicons name="save-outline" size={16} color="#F0F7FF" />
              <Text style={styles.saveText}>Save Changes</Text>
            </>}
          </Pressable>
          <View style={{ height: 20 }} />
        </Animated.ScrollView>
      )}

      {/* Custom Form Field Modal */}
      <Modal
        visible={showCustomFormModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeCustomFormModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customFormModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingFieldIndex !== null ? 'Edit Field' : 'Add Form Field'}
              </Text>
              <Pressable onPress={closeCustomFormModal}>
                <MaterialIcons name="close" size={24} color="#4A5568" />
              </Pressable>
            </View>

            <ScrollView 
              style={styles.customFormModalScroll}
              contentContainerStyle={styles.customFormModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Field Type</Text>
                <Dropdown
                  style={styles.modalDropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  iconStyle={styles.iconStyle}
                  containerStyle={styles.dropdownContainer}
                  itemContainerStyle={styles.itemContainer}
                  itemTextStyle={styles.itemText}
                  activeColor="#E0ECFF"
                  data={[
                    { label: 'Short answer', value: 'text', icon: 'text-fields' },
                    { label: 'Long answer', value: 'textarea', icon: 'subject' },
                    { label: 'Number', value: 'number', icon: 'numbers' },
                    { label: 'Email', value: 'email', icon: 'email' },
                    { label: 'Phone number', value: 'phone', icon: 'phone' },
                    { label: 'Date', value: 'date', icon: 'calendar-today' },
                    { label: 'Dropdown', value: 'dropdown', icon: 'arrow-drop-down-circle' },
                    { label: 'Checkbox', value: 'checkbox', icon: 'check-box' },
                    { label: 'File upload', value: 'file', icon: 'attach-file' },
                  ]}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Select field type"
                  value={newFieldType}
                  onChange={item => setNewFieldType(item.value)}
                  renderItem={(item) => (
                    <View style={styles.dropdownItemWithIcon}>
                      <MaterialIcons name={item.icon} size={18} color="#3A52A6" />
                      <Text style={styles.dropdownItemText}>{item.label}</Text>
                    </View>
                  )}
                  renderLeftIcon={() => 
                    newFieldType ? (
                      <MaterialIcons 
                        name={getFieldIcon(newFieldType)} 
                        size={18} 
                        color="#3A52A6" 
                        style={{ marginRight: 8 }}
                      />
                    ) : null
                  }
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Field Label</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newFieldLabel}
                  onChangeText={setNewFieldLabel}
                  placeholder="e.g., Full Name, Email, etc."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Pressable 
                  style={styles.requiredToggle}
                  onPress={() => setNewFieldRequired(!newFieldRequired)}
                >
                  <View style={[styles.checkbox, newFieldRequired && styles.checkboxChecked]}>
                    {newFieldRequired && (
                      <MaterialIcons name="check" size={16} color="#F0F7FF" />
                    )}
                  </View>
                  <Text style={styles.requiredToggleText}>Required Field</Text>
                </Pressable>
              </View>

              {(newFieldType === 'dropdown' || newFieldType === 'checkbox') && (
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>
                    {newFieldType === 'checkbox' ? 'Checkbox Options' : 'Dropdown Options'}
                  </Text>
                  <View style={styles.arrayInputContainer}>
                    <TextInput
                      style={styles.arrayInput}
                      value={dropdownOptionInput}
                      onChangeText={setDropdownOptionInput}
                      placeholder="Enter option"
                      placeholderTextColor="#A0AEC0"
                      onSubmitEditing={addDropdownOption}
                      returnKeyType="done"
                    />
                    <Pressable style={styles.addButton} onPress={addDropdownOption}>
                      <MaterialIcons name="add" size={20} color="#F0F7FF" />
                    </Pressable>
                  </View>
                  {dropdownOptions.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {dropdownOptions.map((option, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText} numberOfLines={1}>{option}</Text>
                          <Pressable onPress={() => removeDropdownOption(index)}>
                            <MaterialIcons name="close" size={14} color="#111827" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelButton} onPress={closeCustomFormModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveButton} onPress={saveCustomFormField}>
                <Text style={styles.modalSaveText}>
                  {editingFieldIndex !== null ? 'Update' : 'Add'} Field
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function LabeledInput({ label, multiline, ...props }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholderTextColor="#9aa3af"
        {...props}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    paddingBottom: 28,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    padding: 16,
  },
  topBar: {
    height: 80,
    backgroundColor: '#3A52A6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 28,
    elevation: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F0F7FF',
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
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
    color: 'rgba(93, 102, 115, 1)',
    marginTop: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  imageRow: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
  },
  changeImageBtn: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: '#3A52A6',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#5D6673',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
  },
  inputMultiline: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  row2: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3A52A6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  dateInputText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3A52A6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C4CBD5',
    shadowColor: '#3A52A6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
  saveBtn: {
    marginTop: 12,
    backgroundColor: '#EFA508',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  saveText: {
    color: '#F0F7FF',
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
  },
  customFormSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#3A52A6',
    marginBottom: 4,
  },
  helperText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#6B7280',
  },
  customFieldsList: {
    gap: 10,
    marginBottom: 12,
  },
  customFieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E0ECFF',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  fieldIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customFieldInfo: {
    flex: 1,
  },
  customFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  customFieldLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#111827',
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredBadgeText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 9,
    color: '#DC2626',
  },
  customFieldType: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#6B7280',
  },
  customFieldActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editFieldButton: {
    padding: 6,
  },
  removeFieldButton: {
    padding: 6,
  },
  addCustomFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0ECFF',
    borderWidth: 2,
    borderColor: '#3A52A6',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  addCustomFieldText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#3A52A6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  customFormModalContent: {
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 18,
    color: '#3A52A6',
  },
  customFormModalScroll: {
    maxHeight: 400,
  },
  customFormModalScrollContent: {
    paddingBottom: 10,
  },
  modalInputGroup: {
    marginBottom: 18,
  },
  modalLabel: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#4A5568',
    marginBottom: 8,
  },
  modalInput: {
    fontFamily: 'BreeSerif_400Regular',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C4CBD5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#111827',
  },
  modalDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C4CBD5',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  requiredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#C4CBD5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3A52A6',
    borderColor: '#3A52A6',
  },
  requiredToggleText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#111827',
  },
  arrayInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  arrayInput: {
    flex: 1,
    fontFamily: 'BreeSerif_400Regular',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C4CBD5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 12,
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#3A52A6',
    borderRadius: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0ECFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  tagText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#3A52A6',
    flexShrink: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C4CBD5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#4A5568',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#3A52A6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#F0F7FF',
  },
  dropdownItemWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownItemText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
  },
});