import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, Animated, Modal, Image, Alert, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import * as ImagePicker from 'expo-image-picker';
import { scholarshipService, CustomFormField } from '@/services/scholarship-creation.service';
import Toast from '@/components/toast';
import Header from '@/components/header';

export default function CreateScholarshipPage() {
  const [type, setType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [totalSlot, setTotalSlot] = useState('');
  const [deadline, setDeadline] = useState('');
  const [criteria, setCriteria] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [criteriaInput, setCriteriaInput] = useState('');
  const [documentsInput, setDocumentsInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToastType(type);
    setToastTitle(title);
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    };
    requestPermissions();
  }, []);

  const typeDropdownRotation = useRef(new Animated.Value(0)).current;
  const typeDropdownScale = useRef(new Animated.Value(1)).current;
  const purposeDropdownRotation = useRef(new Animated.Value(0)).current;
  const purposeDropdownScale = useRef(new Animated.Value(1)).current;

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isPurposeDropdownOpen, setIsPurposeDropdownOpen] = useState(false);

  const typeItems = [
    { label: 'Merit-Based', value: 'merit_based' },
    { label: 'Skill-Based', value: 'skill_based' },
  ];

  const purposeItems = [
    { label: 'Allowance', value: 'allowance' },
    { label: 'Tuition', value: 'tuition' },
  ];

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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const animateDropdown = (rotation: Animated.Value, scale: Animated.Value, isOpen: boolean) => {
    Animated.parallel([
      Animated.spring(rotation, {
        toValue: isOpen ? 1 : 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.spring(scale, {
        toValue: isOpen ? 1.02 : 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      })
    ]).start();
  };

  const handleTypeDropdownFocus = () => {
    setIsTypeDropdownOpen(true);
    animateDropdown(typeDropdownRotation, typeDropdownScale, true);
  };

  const handleTypeDropdownBlur = () => {
    setIsTypeDropdownOpen(false);
    animateDropdown(typeDropdownRotation, typeDropdownScale, false);
  };

  const handlePurposeDropdownFocus = () => {
    setIsPurposeDropdownOpen(true);
    animateDropdown(purposeDropdownRotation, purposeDropdownScale, true);
  };

  const handlePurposeDropdownBlur = () => {
    setIsPurposeDropdownOpen(false);
    animateDropdown(purposeDropdownRotation, purposeDropdownScale, false);
  };

  const typeIconRotate = typeDropdownRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const purposeIconRotate = purposeDropdownRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const openDescriptionModal = () => {
    setTempDescription(description);
    setShowDescriptionModal(true);
  };

  const saveDescription = () => {
    setDescription(tempDescription);
    setShowDescriptionModal(false);
  };

  const cancelDescription = () => {
    setTempDescription(description);
    setShowDescriptionModal(false);
  };

  const addCriterion = () => {
    const trimmedInput = criteriaInput.trim();
    if (trimmedInput) {
      setCriteria(prevCriteria => [...prevCriteria, trimmedInput]);
      setCriteriaInput('');
    }
  };

  const removeCriterion = (index: number) => {
    setCriteria(prevCriteria => prevCriteria.filter((_, i) => i !== index));
  };

  const addDocument = () => {
    const trimmedInput = documentsInput.trim();
    if (trimmedInput) {
      setDocuments(prevDocuments => [...prevDocuments, trimmedInput]);
      setDocumentsInput('');
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prevDocuments => prevDocuments.filter((_, i) => i !== index));
  };

  // Custom form field handlers
  const openCustomFormModal = (index?: number) => {
    if (index !== undefined) {
      // Editing existing field
      const field = customFormFields[index];
      setEditingFieldIndex(index);
      setNewFieldType(field.type);
      setNewFieldLabel(field.label);
      setNewFieldRequired(field.required);
      setDropdownOptions(field.options || []);
      setDropdownOptionInput('');
    } else {
      // Adding new field
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
      // Update existing field
      setCustomFormFields(customFormFields.map((field, index) => 
        index === editingFieldIndex ? newField : field
      ));
    } else {
      // Add new field
      setCustomFormFields([...customFormFields, newField]);
    }

    closeCustomFormModal();
  };

  const removeCustomFormField = (index: number) => {
    setCustomFormFields(customFormFields.filter((_, i) => i !== index));
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showToast('error', 'Permission Required', 'Camera roll permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('error', 'Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToast('error', 'Validation Error', 'Please enter a scholarship title');
      return;
    }

    if (!totalAmount.trim() || isNaN(parseFloat(totalAmount))) {
      showToast('error', 'Validation Error', 'Please enter a valid total amount');
      return;
    }

    if (!totalSlot.trim() || isNaN(parseInt(totalSlot)) || parseInt(totalSlot) <= 0) {
      showToast('error', 'Validation Error', 'Please enter a valid total slot');
      return;
    }

    if (criteria.length === 0) {
      showToast('error', 'Validation Error', 'Please add at least one eligibility criterion');
      return;
    }

    if (documents.length === 0) {
      showToast('error', 'Validation Error', 'Please add at least one required document');
      return;
    }

    setIsLoading(true);

    try {
      // Create the scholarship
      const scholarshipData = {
        type: type || undefined,
        purpose: purpose || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        total_amount: parseFloat(totalAmount),
        total_slot: parseInt(totalSlot),
        application_deadline: deadline || undefined,
        criteria,
        required_documents: documents,
        custom_form_fields: customFormFields.length > 0 ? customFormFields : undefined,
      };

      const result = await scholarshipService.createScholarship(scholarshipData);

      if (result.success && result.scholarship) {
        const scholarshipId = result.scholarship.scholarship_id;

        if (imageUri) {
          await scholarshipService.uploadScholarshipImage(scholarshipId, imageUri);
        }

        showToast('success', 'Success', 'Scholarship created successfully!');

        // Reset
        setType('');
        setPurpose('');
        setTitle('');
        setDescription('');
        setTotalAmount('');
        setTotalSlot('');
        setDeadline('');
        setCriteria([]);
        setDocuments([]);
        setCriteriaInput('');
        setDocumentsInput('');
        setImageUri(null);
        setDate(new Date());
        setCustomFormFields([]);
      } else {
        showToast('error', 'Error', result.message || 'Failed to create scholarship');
      }
    } catch (error) {
      console.error('Error creating scholarship:', error);
      showToast('error', 'Error', 'Failed to create scholarship. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header 
        title="Create Scholarship" 
        showSearch={false}
      />

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Upload Area */}
        <Pressable 
          onPress={pickImage} 
          style={[styles.uploadContainer, imageUri && styles.uploadContainerWithImage]}
        >
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
              <Pressable 
                style={styles.removeImageButton}
                onPress={() => setImageUri(null)}
              >
                <MaterialIcons name="close" size={21} color="#F0F7FF" />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={pickImage} style={styles.uploadBox}>
              <MaterialIcons name="file-upload" size={48} color="#5B7BA6" />
              <Text style={styles.uploadText}>Tap to upload scholarship image</Text>
            </Pressable>
          )}
        </Pressable>

        {/* Dropdowns */}
        <View style={styles.row}>
          <View style={styles.dropdownWrapper}>
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
                onChange={item => {
                  setType(item.value);
                  handleTypeDropdownBlur();
                }}
                onFocus={handleTypeDropdownFocus}
                onBlur={handleTypeDropdownBlur}
                renderRightIcon={() => (
                  <Animated.View style={{ transform: [{ rotate: typeIconRotate }] }}>
                    <MaterialIcons name="arrow-drop-down" size={20} color="#6B7280" />
                  </Animated.View>
                )}
              />
            </Animated.View>
          </View>

          <View style={styles.dropdownWrapper}>
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
                onChange={item => {
                  setPurpose(item.value);
                  handlePurposeDropdownBlur();
                }}
                onFocus={handlePurposeDropdownFocus}
                onBlur={handlePurposeDropdownBlur}
                renderRightIcon={() => (
                  <Animated.View style={{ transform: [{ rotate: purposeIconRotate }] }}>
                    <MaterialIcons name="arrow-drop-down" size={20} color="#6B7280" />
                  </Animated.View>
                )}
              />
            </Animated.View>
          </View>
        </View>

        {/* Title */}
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.inputTitle}
            value={title}
            onChangeText={setTitle}
            placeholder="Scholarship Title"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Pressable style={styles.addDescriptionButton} onPress={openDescriptionModal}>
            <MaterialIcons name="menu" size={16} color="#8B9CB5" />
            <Text style={styles.addDescriptionText}>
              {description ? 'Edit Description' : 'Add Description'}
            </Text>
          </Pressable>
          {description && (
            <Text style={styles.descriptionPreview} numberOfLines={1}>
              {description}
            </Text>
          )}
        </View>

        {/* Total Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Amount</Text>
          <TextInput
            style={styles.input}
            value={totalAmount}
            onChangeText={setTotalAmount}
            placeholder="Enter total amount"
            placeholderTextColor="#A0AEC0"
            keyboardType="numeric"
          />
        </View>

        {/* Total Slot */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Slot</Text>
          <TextInput
            style={styles.input}
            value={totalSlot}
            onChangeText={setTotalSlot}
            placeholder="Enter total slot"
            placeholderTextColor="#A0AEC0"
            keyboardType="numeric"
          />
        </View>

        {/* Application Deadline */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Application Deadline</Text>
          <Pressable 
            style={styles.dateInputContainer}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="calendar-today" size={18} color="#6B7280" />
            <Text style={[styles.dateInputText, !deadline && styles.placeholderText]}>
              {deadline ? formatDate(deadline) : 'Set application deadline'}
            </Text>
          </Pressable>
          
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDate}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Criteria */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Criteria</Text>
          <View style={styles.arrayInputContainer}>
            <TextInput
              style={styles.arrayInput}
              value={criteriaInput}
              onChangeText={setCriteriaInput}
              placeholder="Enter eligibility criterion"
              placeholderTextColor="#A0AEC0"
              onSubmitEditing={addCriterion}
              returnKeyType="done"
            />
            <Pressable style={styles.addButton} onPress={addCriterion}>
              <MaterialIcons name="add" size={20} color="#F0F7FF" />
            </Pressable>
          </View>
          {criteria.length > 0 && (
            <View style={styles.tagsContainer}>
              {criteria.map((criterion, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText} numberOfLines={1}>{criterion}</Text>
                  <Pressable onPress={() => removeCriterion(index)}>
                    <MaterialIcons name="close" size={14} color="#111827" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Required Documents */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Required Documents</Text>
          <View style={styles.arrayInputContainer}>
            <TextInput
              style={styles.arrayInput}
              value={documentsInput}
              onChangeText={setDocumentsInput}
              placeholder="Enter required document"
              placeholderTextColor="#A0AEC0"
              onSubmitEditing={addDocument}
              returnKeyType="done"
            />
            <Pressable style={styles.addButton} onPress={addDocument}>
              <MaterialIcons name="add" size={20} color="#F0F7FF" />
            </Pressable>
          </View>
          {documents.length > 0 && (
            <View style={styles.tagsContainer}>
              {documents.map((document, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText} numberOfLines={1}>{document}</Text>
                  <Pressable onPress={() => removeDocument(index)}>
                    <MaterialIcons name="close" size={14} color="#111827" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Custom Form Fields */}
        <View style={styles.inputGroup}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Application Form</Text>
            <Text style={styles.helperText}>Add custom fields to collect information from applicants.</Text>
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
                ? 'Add Form Field' 
                : 'Add Another Field'}
            </Text>
          </Pressable>
        </View>

        {/* Create Button */}
        <Pressable 
          style={[styles.createButton, isLoading && styles.createButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#F0F7FF" />
          ) : (
            <Text style={styles.createButtonText}>Create Scholarship</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Description Modal */}
      <Modal
        visible={showDescriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDescription}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scholarship Description</Text>
              <Pressable onPress={cancelDescription}>
                <MaterialIcons name="close" size={24} color="#4A5568" />
              </Pressable>
            </View>
            
            <TextInput
              style={styles.modalTextArea}
              value={tempDescription}
              onChangeText={setTempDescription}
              placeholder="Enter detailed description of the scholarship program, its objectives, and what it offers to students..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelButton} onPress={cancelDescription}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveButton} onPress={saveDescription}>
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
                {editingFieldIndex !== null ? 'Edit Field' : 'Add Form'}
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
              {/* Field Type */}
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

              {/* Field Label */}
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

              {/* Required Toggle */}
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

              {/* Dropdown Options (only for dropdown type) */}
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

            {/* Modal Buttons */}
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

      {/* Toast */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    backgroundColor: '#F0F7FF',
    gap: 8,
  },
  headerText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 18,
    color: '#3A52A6',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 55,
  },
  uploadContainer: {
    borderWidth: 2,
    borderColor: '#3A52A6',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 60,
    marginBottom: 18,
    backgroundColor: 'transparent',
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#3A52A6',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  uploadContainerWithImage: {
    padding: 0,
    borderWidth: 0,
    borderStyle: 'solid',
  },
  uploadText: {
    fontFamily: 'BreeSerif_400Regular',
    marginTop: 12,
    fontSize: 12,
    color: '#3A52A6',
    opacity: 0.7,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 18,
  },
  uploadedImage: {
    aspectRatio: 1,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  dropdownWrapper: {
    flex: 1,
  },
  dropdown: {
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C4CBD5',
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
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C4CBD5',
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
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    fontFamily: 'BreeSerif_400Regular',
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#C4CBD5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 12,
    color: '#111827',
  },
  inputTitle: {
    backgroundColor: 'transparent',
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 26,
    color: '#111827',
    paddingBottom: 8,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  addDescriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 102, 115, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  addDescriptionText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  descriptionPreview: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 2,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#C4CBD5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dateInputText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  createButton: {
    backgroundColor: '#EFA508',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
    color: '#F0F7FF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
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
  modalTextArea: {
    fontFamily: 'BreeSerif_400Regular',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C4CBD5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 12,
    color: '#111827',
    height: 200,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
  arrayInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  arrayInput: {
    flex: 1,
    fontFamily: 'BreeSerif_400Regular',
    backgroundColor: 'transparent',
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  tagText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#3A52A6',
    flexShrink: 1,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 12,
  },
  helperText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 2,
  },
  customFieldsList: {
    gap: 10,
    marginBottom: 12,
  },
  customFieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0ECFF',
    borderRadius: 10,
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredBadgeText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 10,
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
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  addCustomFieldText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#3A52A6',
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
    overflow: 'hidden',
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
    marginLeft: 2,
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