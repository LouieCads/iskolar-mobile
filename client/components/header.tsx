import { View, Text, Pressable, StyleSheet, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { authService } from '@/services/auth.service';

interface HeaderProps {
  title: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

export default function Header({ 
  title, 
  onSearch, 
  showSearch = true 
}: HeaderProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const result = await authService.getProfileStatus();
        if (result.success && result.user?.role) {
          setUserRole(result.user.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, []);

  const handleLogoPress = () => {
    if (userRole === 'sponsor') {
      router.push('/my-scholarships');
    } else if (userRole === 'student') {
      router.push('/home');
    } else {
      router.push('/home');
    }
  };

  const handleSearchPress = () => {
    setSearchVisible(true);
  };

  const handleSearchClose = () => {
    setSearchVisible(false);
    setSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (onSearch) {
      onSearch(text);
    }
  };

  return (
    <View style={styles.header}>
      {!searchVisible ? (
        <>
          <View style={styles.logoContainer}>
            <Pressable onPress={handleLogoPress}>
              <Image source={require('../assets/images/iskolar.png')} style={styles.image}/>
            </Pressable>
            <Text style={styles.logoText}>{title}</Text>
          </View>
          {showSearch && (
            <Pressable style={styles.searchButton} onPress={handleSearchPress}>
              <Ionicons name="search" size={20} color="#666" />
              <Text style={styles.searchText}>Search</Text>
            </Pressable>
          )}
        </>
      ) : (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search scholarships..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => handleSearchChange('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </Pressable>
            )}
          </View>
          <Pressable onPress={handleSearchClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 48,
    height: 48,
  },
  logoText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 20,
    color: '#3A52A6',
    marginLeft: 4,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    paddingLeft: 8,
    paddingRight: 50,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 8,
  },
  searchText: {
    fontFamily: 'BreeSerif_400Regular',
    color: '#5D6673',
    fontSize: 13,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#111827',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontFamily: 'BreeSerif_400Regular',
    fontSize: 13,
    color: '#3A52A6',
  },
});