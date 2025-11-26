import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { authService } from '@/services/auth.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import Toast from '@/components/toast';
import LoadingScreen from '@/components/loading-screen';

// Student Profile Validation 
const studentProfileSchema = z.object({
  full_name: z.string().nonempty("Name is required"),
  gender: z.string().nonempty("Gender is required"),
  date_of_birth: z.date(),
  contact_number: z.string().nonempty("Contact number is required").refine((val) => {
          if (!val) return true;
          const phoneDigits = val.replace(/\D/g, '');
          return (
            (phoneDigits.length === 11 && phoneDigits.startsWith('09')) ||
            (phoneDigits.length === 12 && phoneDigits.startsWith('63')) ||
            (phoneDigits.length === 10 && phoneDigits.startsWith('02'))
          );
        }, `Must be a valid phone number`),
});

// Sponsor Profile Validation 
const sponsorProfileSchema = z.object({
  organization_name: z.string().nonempty("Organization name is required"),
  organization_type: z.string().nonempty("Organization type is required"),
  contact_number: z.string().nonempty("Contact number is required").refine((val) => {
          if (!val) return true;
          const phoneDigits = val.replace(/\D/g, '');
          return (
            (phoneDigits.length === 11 && phoneDigits.startsWith('09')) ||
            (phoneDigits.length === 12 && phoneDigits.startsWith('63')) ||
            (phoneDigits.length === 10 && phoneDigits.startsWith('02'))
          );
        }, `Must be a valid phone number`),
});

type StudentFormData = z.infer<typeof studentProfileSchema>;
type SponsorFormData = z.infer<typeof sponsorProfileSchema>;

export default function ProfileSetupPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = params.role as 'student' | 'sponsor';

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  });

  // Animation values for dropdowns
  const genderDropdownRotation = useRef(new Animated.Value(0)).current;
  const genderDropdownScale = useRef(new Animated.Value(1)).current;
  const orgTypeDropdownRotation = useRef(new Animated.Value(0)).current;
  const orgTypeDropdownScale = useRef(new Animated.Value(1)).current;

  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isOrgTypeDropdownOpen, setIsOrgTypeDropdownOpen] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const hasToken = await authService.hasValidToken();
        if (!hasToken) {
          router.push('/login');
          return;
        }

        const result = await authService.getProfileStatus();
        
        if (!result.user?.has_selected_role && !result.user?.role) {
          router.replace({ pathname: '/role-selection' });
        }

        if (result.user?.profile_completed) {
          if (result.user?.role === 'student') {
            router.replace('../(student)/home');
          } else if (result.user?.role === 'sponsor') {
            router.replace('../(sponsor)/my-scholarships');
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserRole();
  }, []);

  // Student form
  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      full_name: '',
      gender: '',
      date_of_birth: new Date(),
      contact_number: '',
    },
  });

  // Sponsor form
  const sponsorForm = useForm<SponsorFormData>({
    resolver: zodResolver(sponsorProfileSchema),
    defaultValues: {
      organization_name: '',
      organization_type: '',
      contact_number: '',
    },
  });

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ visible: true, type, title, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2000);
  };

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    
    if (role === 'student') {
      studentForm.setValue('date_of_birth', currentDate);
    }
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

  const handleGenderDropdownFocus = () => {
    setIsGenderDropdownOpen(true);
    animateDropdown(genderDropdownRotation, genderDropdownScale, true);
  };

  const handleGenderDropdownBlur = () => {
    setIsGenderDropdownOpen(false);
    animateDropdown(genderDropdownRotation, genderDropdownScale, false);
  };

  const handleOrgTypeDropdownFocus = () => {
    setIsOrgTypeDropdownOpen(true);
    animateDropdown(orgTypeDropdownRotation, orgTypeDropdownScale, true);
  };

  const handleOrgTypeDropdownBlur = () => {
    setIsOrgTypeDropdownOpen(false);
    animateDropdown(orgTypeDropdownRotation, orgTypeDropdownScale, false);
  };

  const handleComplete = async (data: StudentFormData | SponsorFormData) => {
    try {
      setLoading(true);

      if (role === 'student') {
        const studentData = data as StudentFormData;
        
        // Format date to YYYY-MM-DD for backend
        const formattedDate = studentData.date_of_birth.toISOString().split('T')[0];
        
        const result = await authService.setupStudentProfile({
          full_name: studentData.full_name,
          gender: studentData.gender,
          date_of_birth: formattedDate,
          contact_number: studentData.contact_number,
        });

        if (result.success) {
          showToast('success', 'Profile Created', 'Your profile has been set up successfully');
          setShowLoadingScreen(true);
          setTimeout(() => {
            router.replace('../(student)/home');
          }, 2000);
        } else {
          showToast('error', 'Error', result.message);
        }
      } else {
        const sponsorData = data as SponsorFormData;
        
        const result = await authService.setupSponsorProfile({
          organization_name: sponsorData.organization_name,
          organization_type: sponsorData.organization_type,
          contact_number: sponsorData.contact_number,
        });

        if (result.success) {
          showToast('success', 'Profile Created', 'Your profile has been set up successfully');
          setShowLoadingScreen(true);
          setTimeout(() => {
            router.replace('../(sponsor)/my-scholarships');
          }, 2000);
        } else {
          showToast('error', 'Error', result.message);
        }
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      showToast('error', 'Connection Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const genderItems = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ];

  const orgTypeItems = [
    { label: 'Non-profit', value: 'non_profit' },
    { label: 'Private Company', value: 'private_company' },
    { label: 'Government Agency', value: 'government_agency' },
    { label: 'Educational Institution', value: 'educational_institution' },
    { label: 'Foundation', value: 'foundation' },
  ];

  const genderIconRotate = genderDropdownRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const orgTypeIconRotate = orgTypeDropdownRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  if (showLoadingScreen) {
    return (
      <LoadingScreen 
        title="Unlocking opportunities" 
        subtitle="Setting up your profile..." 
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
      />

      {/* Back */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="keyboard-arrow-left" size={22} color="#3A52A6" />
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to iSkolar</Text>
        <Text style={styles.subtitle}>
          {role === 'student' 
            ? 'Complete your profile to get started' 
            : 'Set up your organization profile'}
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {role === 'student' ? (
          <>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <Controller
                control={studentForm.control}
                name="full_name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, studentForm.formState.errors.full_name && styles.inputError]}
                    placeholder="Enter full name"
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {studentForm.formState.errors.full_name && (
                <Text style={styles.errorText}>{studentForm.formState.errors.full_name.message}</Text>
              )}
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <Controller
                control={studentForm.control}
                name="gender"
                render={({ field: { onChange, value } }) => (
                  <Animated.View style={{ transform: [{ scale: genderDropdownScale }] }}>
                    <Dropdown
                      style={[styles.dropdown, studentForm.formState.errors.gender && styles.inputError]}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      iconStyle={styles.iconStyle}
                      containerStyle={styles.dropdownContainer}
                      itemContainerStyle={styles.itemContainer}
                      itemTextStyle={styles.itemText}
                      activeColor="#E0ECFF"
                      data={genderItems}
                      maxHeight={300}
                      labelField="label"
                      valueField="value"
                      placeholder="Select gender"
                      value={value}
                      onChange={item => {
                        onChange(item.value);
                        handleGenderDropdownBlur();
                      }}
                      onFocus={handleGenderDropdownFocus}
                      onBlur={handleGenderDropdownBlur}
                      renderRightIcon={() => (
                        <Animated.View style={{ transform: [{ rotate: genderIconRotate }] }}>
                          <MaterialIcons name="arrow-drop-down" size={20} color="#6B7280" />
                        </Animated.View>
                      )}
                    />
                  </Animated.View>
                )}
              />
              {studentForm.formState.errors.gender && (
                <Text style={styles.errorText}>{studentForm.formState.errors.gender.message}</Text>
              )}
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <Controller
                control={studentForm.control}
                name="date_of_birth"
                render={({ field: { value } }) => (
                  <>
                    <Pressable onPress={() => setShowDatePicker(true)}>
                      <TextInput
                        style={[styles.input, studentForm.formState.errors.date_of_birth && styles.inputError]}
                        placeholder="MM/DD/YYYY"
                        placeholderTextColor="#9CA3AF"
                        value={value.toLocaleDateString('en-US')}
                        editable={false}
                        pointerEvents="none"
                      />
                    </Pressable>
                    {showDatePicker && (
                      <DateTimePicker
                        value={value}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                        maximumDate={new Date()}
                      />
                    )}
                  </>
                )}
              />
              {studentForm.formState.errors.date_of_birth && (
                <Text style={styles.errorText}>{studentForm.formState.errors.date_of_birth.message}</Text>
              )}
            </View>

            {/* Contact Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Number</Text>
              <Controller
                control={studentForm.control}
                name="contact_number"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, studentForm.formState.errors.contact_number && styles.inputError]}
                    placeholder="Enter contact number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {studentForm.formState.errors.contact_number && (
                <Text style={styles.errorText}>{studentForm.formState.errors.contact_number.message}</Text>
              )}
            </View>
          </>
        ) : (
          <>
            {/* Organization Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization Name</Text>
              <Controller
                control={sponsorForm.control}
                name="organization_name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, sponsorForm.formState.errors.organization_name && styles.inputError]}
                    placeholder="Enter organization name"
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {sponsorForm.formState.errors.organization_name && (
                <Text style={styles.errorText}>{sponsorForm.formState.errors.organization_name.message}</Text>
              )}
            </View>

            {/* Organization Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization Type</Text>
              <Controller
                control={sponsorForm.control}
                name="organization_type"
                render={({ field: { onChange, value } }) => (
                  <Animated.View style={{ transform: [{ scale: orgTypeDropdownScale }] }}>
                    <Dropdown
                      style={[styles.dropdown, sponsorForm.formState.errors.organization_type && styles.inputError]}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      iconStyle={styles.iconStyle}
                      containerStyle={styles.dropdownContainer}
                      itemContainerStyle={styles.itemContainer}
                      itemTextStyle={styles.itemText}
                      activeColor="#E0ECFF"
                      data={orgTypeItems}
                      maxHeight={300}
                      labelField="label"
                      valueField="value"
                      placeholder="Select organization type"
                      value={value}
                      onChange={item => {
                        onChange(item.value);
                        handleOrgTypeDropdownBlur();
                      }}
                      onFocus={handleOrgTypeDropdownFocus}
                      onBlur={handleOrgTypeDropdownBlur}
                      renderRightIcon={() => (
                        <Animated.View style={{ transform: [{ rotate: orgTypeIconRotate }] }}>
                          <MaterialIcons name="arrow-drop-down" size={20} color="#6B7280" />
                        </Animated.View>
                      )}
                    />
                  </Animated.View>
                )}
              />
              {sponsorForm.formState.errors.organization_type && (
                <Text style={styles.errorText}>{sponsorForm.formState.errors.organization_type.message}</Text>
              )}
            </View>

            {/* Contact Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Number</Text>
              <Controller
                control={sponsorForm.control}
                name="contact_number"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, sponsorForm.formState.errors.contact_number && styles.inputError]}
                    placeholder="Enter contact number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {sponsorForm.formState.errors.contact_number && (
                <Text style={styles.errorText}>{sponsorForm.formState.errors.contact_number.message}</Text>
              )}
            </View>
          </>
        )}
      </View>

      {/* Button */}
      <Pressable 
        style={[styles.button, loading && styles.buttonDisabled]} 
        disabled={loading}
        onPress={role === 'student' 
          ? studentForm.handleSubmit(handleComplete)
          : sponsorForm.handleSubmit(handleComplete)
        }
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : 'Complete'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 55,
    width: 30,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 32,
    color: '#3A52A6',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 16,
    color: '#3A52A6',
    textAlign: 'center',
  },
  form: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#4A5568',
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C4CBD5',
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 12,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 2,
  },
  dropdown: {
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C4CBD5',
    paddingVertical: 12,
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
  selectedItem: {
    backgroundColor: '#E0ECFF',
  },
  button: {
    backgroundColor: '#3A52A6',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  buttonDisabled: {
    backgroundColor: '#AEB5C2',
  },
  buttonText: {
    color: '#F0F7FF',
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 14,
  },
});