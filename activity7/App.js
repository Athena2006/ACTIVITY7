import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Animated,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_KEY = '@skillquest_skills';

// Animated card for every skill
function SkillCard({ item, onEdit, onDelete, onProgress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: item.progress,
        duration: 900,
        useNativeDriver: false,
      }),
    ]).start();
  }, [item.progress]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.skillCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.skillHeader}>
        <View style={styles.skillIcon}>
          <Text style={styles.skillIconText}>✿</Text>
        </View>

        <View style={styles.skillInfo}>
          <Text style={styles.skillName}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEdit(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Your Progress</Text>
        <Text style={styles.progressPercent}>{item.progress}%</Text>
      </View>

      <View style={styles.progressBackground}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: animatedWidth },
          ]}
        />
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.progressButton}
          onPress={() => onProgress(item.id, -10)}
        >
          <Text style={styles.progressButtonText}>-10%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.progressButton}
          onPress={() => onProgress(item.id, 10)}
        >
          <Text style={styles.progressButtonText}>+10%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function App() {
  const [skills, setSkills] = useState([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Retrieve saved skills when the app opens
    const loadSkills = async () => {
      try {
        const savedSkills = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedSkills !== null) {
          const parsedSkills = JSON.parse(savedSkills);

          if (Array.isArray(parsedSkills)) {
            setSkills(parsedSkills);
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Unable to load saved skills.');
      } finally {
        setLoading(false);
      }
    };

    loadSkills();

    // Animate the dashboard when it appears
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, []);

  // Save the latest skill list to local storage
  const saveSkills = async (updatedSkills) => {
    try {
      setSaving(true);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedSkills)
      );

      setSkills(updatedSkills);
      return true;
    } catch (error) {
      Alert.alert('Error', 'Unable to save your skills.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Add a new skill or update an existing skill
  const handleSave = async () => {
    if (!name.trim() || !category.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter a skill name and category.'
      );
      return;
    }

    let updatedSkills;

    if (editingId) {
      updatedSkills = skills.map((skill) =>
        skill.id === editingId
          ? {
              ...skill,
              name: name.trim(),
              category: category.trim(),
            }
          : skill
      );
    } else {
      const newSkill = {
        id: Date.now().toString(),
        name: name.trim(),
        category: category.trim(),
        progress: 0,
      };

      updatedSkills = [...skills, newSkill];
    }

    const success = await saveSkills(updatedSkills);

    if (success) {
      cancelEdit();
    }
  };

  // Load selected skill into the form
  const handleEdit = (skill) => {
    setEditingId(skill.id);
    setName(skill.name);
    setCategory(skill.category);
  };

  // Clear the input fields
  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setCategory('');
  };

  // Delete a skill after confirmation
  const handleDelete = (id) => {
    Alert.alert(
      'Delete Skill',
      'Are you sure you want to delete this skill?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedSkills = skills.filter(
              (skill) => skill.id !== id
            );

            const success = await saveSkills(updatedSkills);

            if (success && editingId === id) {
              cancelEdit();
            }
          },
        },
      ]
    );
  };

  // Increase or decrease skill progress
  const updateProgress = (id, amount) => {
    const updatedSkills = skills.map((skill) =>
      skill.id === id
        ? {
            ...skill,
            progress: Math.max(
              0,
              Math.min(100, skill.progress + amount)
            ),
          }
        : skill
    );

    saveSkills(updatedSkills);
  };

  // Calculate dashboard statistics
  const totalSkills = skills.length;

  const completedSkills = skills.filter(
    (skill) => skill.progress === 100
  ).length;

  const averageProgress =
    totalSkills === 0
      ? 0
      : Math.round(
          skills.reduce((total, skill) => total + skill.progress, 0) /
            totalSkills
        );

  const renderSkill = ({ item }) => (
    <SkillCard
      item={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onProgress={updateProgress}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <StatusBar backgroundColor="#FFF0F5" barStyle="dark-content" />

        <Text style={styles.loadingLogo}>SkillQuest ♡</Text>

        <ActivityIndicator size="large" color="#E75480" />

        <Text style={styles.loadingText}>
          Preparing your learning journey...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar
        backgroundColor="#FFF0F5"
        barStyle="dark-content"
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          style={styles.flatList}
          data={skills}
          renderItem={renderSkill}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* App title */}
              <Animated.View
                style={{
                  opacity: headerAnim,
                  transform: [
                    {
                      translateY: headerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                }}
              >
                <View style={styles.topHeader}>
                  <View>
                    <Text style={styles.logo}>SkillQuest ♡</Text>
                    <Text style={styles.subtitle}>
                      Grow, learn, and achieve!
                    </Text>
                  </View>

                  <View style={styles.logoCircle}>
                    <Text style={styles.logoIcon}>✿</Text>
                  </View>
                </View>

                {/* Welcome banner */}
                <View style={styles.welcomeCard}>
                  <Text style={styles.welcomeSmall}>
                    YOUR PERSONAL GROWTH SPACE
                  </Text>

                  <Text style={styles.welcomeTitle}>
                    Keep Blooming!
                  </Text>

                  <Text style={styles.welcomeDescription}>
                    Every new skill is a new achievement.
                    Keep learning and believe in yourself.
                  </Text>

                  <Text style={styles.flowerDecoration}>✿ ♡ ✿</Text>
                </View>

                {/* Dashboard statistics */}
                <Text style={styles.sectionTitle}>
                  Your Overview
                </Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <Text style={styles.statIcon}>✿</Text>
                    <Text style={styles.statNumber}>
                      {totalSkills}
                    </Text>
                    <Text style={styles.statLabel}>Total Skills</Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statIcon}>♡</Text>
                    <Text style={styles.statNumber}>
                      {completedSkills}
                    </Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statIcon}>✧</Text>
                    <Text style={styles.statNumber}>
                      {averageProgress}%
                    </Text>
                    <Text style={styles.statLabel}>Average</Text>
                  </View>
                </View>

                {/* Add or edit skill form */}
                <Text style={styles.sectionTitle}>
                  {editingId ? 'Edit Your Skill' : 'Add New Skill'}
                </Text>

                <View style={styles.formCard}>
                  <Text style={styles.inputLabel}>Skill Name</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="e.g. React Native"
                    placeholderTextColor="#C28A9E"
                    value={name}
                    onChangeText={setName}
                    returnKeyType="next"
                  />

                  <Text style={styles.inputLabel}>Category</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Programming"
                    placeholderTextColor="#C28A9E"
                    value={category}
                    onChangeText={setCategory}
                    returnKeyType="done"
                  />

                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      saving && styles.disabledButton,
                    ]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addButtonText}>
                      {saving
                        ? 'Saving...'
                        : editingId
                          ? '♡ Save Changes'
                          : '+ Add My Skill'}
                    </Text>
                  </TouchableOpacity>

                  {editingId && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={cancelEdit}
                    >
                      <Text style={styles.cancelText}>
                        Cancel Editing
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Skill list title */}
                <View style={styles.skillListHeader}>
                  <Text style={styles.sectionTitle}>My Skills</Text>

                  <Text style={styles.skillCount}>
                    {totalSkills} {totalSkills === 1 ? 'skill' : 'skills'}
                  </Text>
                </View>
              </Animated.View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>♡</Text>
              <Text style={styles.emptyTitle}>
                Start Your Journey!
              </Text>
              <Text style={styles.emptyDescription}>
                Add your first skill and begin tracking your progress.
              </Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Made for your growth ♡
              </Text>
              <Text style={styles.footerSubtext}>
                Keep learning. Keep blooming.
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF0F5',
  },

  container: {
    flex: 1,
  },

  flatList: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 45,
    flexGrow: 1,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingLogo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#E75480',
    marginBottom: 25,
  },

  loadingText: {
    color: '#A66A7E',
    marginTop: 15,
  },

  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  logo: {
    fontSize: 29,
    fontWeight: 'bold',
    color: '#E75480',
  },

  subtitle: {
    color: '#A66A7E',
    fontSize: 13,
    marginTop: 4,
  },

  logoCircle: {
    width: 48,
    height: 48,
    backgroundColor: '#FAD1E0',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoIcon: {
    color: '#E75480',
    fontSize: 25,
  },

  welcomeCard: {
    backgroundColor: '#F28FB3',
    borderRadius: 24,
    padding: 23,
    marginBottom: 25,
    overflow: 'hidden',
  },

  welcomeSmall: {
    color: '#FFF5F8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },

  welcomeTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
  },

  welcomeDescription: {
    color: 'white',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: '90%',
  },

  flowerDecoration: {
    color: '#FFE4EE',
    fontSize: 28,
    textAlign: 'right',
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C74370',
    marginBottom: 13,
  },

  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
  },

  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 17,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
  },

  statIcon: {
    color: '#E75480',
    fontSize: 20,
  },

  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C74370',
    marginTop: 5,
  },

  statLabel: {
    color: '#A66A7E',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },

  formCard: {
    backgroundColor: 'white',
    padding: 17,
    borderRadius: 20,
    marginBottom: 25,
    elevation: 3,
  },

  inputLabel: {
    color: '#C74370',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 7,
  },

  input: {
    backgroundColor: '#FFF0F5',
    borderRadius: 13,
    padding: 14,
    marginBottom: 15,
    color: '#843B59',
    fontSize: 14,
  },

  addButton: {
    backgroundColor: '#E75480',
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 3,
  },

  disabledButton: {
    opacity: 0.6,
  },

  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },

  cancelButton: {
    alignItems: 'center',
    padding: 12,
  },

  cancelText: {
    color: '#C74370',
    fontWeight: 'bold',
  },

  skillListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  skillCount: {
    color: '#A66A7E',
    marginBottom: 13,
    fontSize: 12,
  },

  skillCard: {
    backgroundColor: 'white',
    padding: 17,
    borderRadius: 20,
    marginBottom: 15,
    elevation: 3,
  },

  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  skillIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#FCE0EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  skillIconText: {
    color: '#E75480',
    fontSize: 23,
  },

  skillInfo: {
    flex: 1,
  },

  skillName: {
    color: '#C74370',
    fontSize: 16,
    fontWeight: 'bold',
  },

  category: {
    color: '#A66A7E',
    fontSize: 12,
    marginTop: 5,
  },

  editButton: {
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
  },

  editButtonText: {
    color: '#E75480',
    fontWeight: 'bold',
    fontSize: 12,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },

  progressLabel: {
    color: '#A66A7E',
    fontSize: 12,
  },

  progressPercent: {
    color: '#E75480',
    fontWeight: 'bold',
    fontSize: 12,
  },

  progressBackground: {
    height: 10,
    backgroundColor: '#FCE0EA',
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#E75480',
    borderRadius: 10,
  },

  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },

  progressButton: {
    backgroundColor: '#FCE0EA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },

  progressButtonText: {
    color: '#C74370',
    fontWeight: 'bold',
    fontSize: 12,
  },

  deleteButton: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 'auto',
  },

  deleteButtonText: {
    color: '#D94A70',
    fontWeight: 'bold',
    fontSize: 12,
  },

  emptyCard: {
    backgroundColor: 'white',
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },

  emptyIcon: {
    fontSize: 40,
    color: '#E75480',
  },

  emptyTitle: {
    color: '#C74370',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },

  emptyDescription: {
    color: '#A66A7E',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: 25,
  },

  footerText: {
    color: '#C74370',
    fontWeight: 'bold',
  },

  footerSubtext: {
    color: '#A66A7E',
    fontSize: 12,
    marginTop: 5,
  },
});