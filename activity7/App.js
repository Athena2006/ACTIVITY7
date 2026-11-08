import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Animated,
  TextInput, TouchableOpacity, StatusBar, Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@skillquest_skills';

export default function App() {
  const [skills, setSkills] = useState([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load saved skills when the app starts
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

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Save the latest skill list
  const saveSkills = async (updatedSkills) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedSkills)
      );
      setSkills(updatedSkills);
    } catch (error) {
      Alert.alert('Error', 'Unable to save your skills.');
    }
  };

  // Add a new skill
  const addSkill = async () => {
    if (!name.trim() || !category.trim()) {
      Alert.alert('Missing Information', 'Please fill in both fields.');
      return;
    }

    const newSkill = {
      id: Date.now().toString(),
      name: name.trim(),
      category: category.trim(),
      progress: 0,
    };

    await saveSkills([...skills, newSkill]);
    setName('');
    setCategory('');
  };

  const renderSkill = ({ item }) => (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <Text style={styles.skillName}>{item.name}</Text>
      <Text style={styles.category}>{item.category}</Text>

      <View style={styles.progressBackground}>
        <View style={[styles.progress, { width: `${item.progress}%` }]} />
      </View>

      <Text style={styles.percent}>{item.progress}% completed</Text>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#E75480" />
        <Text style={styles.loadingText}>Loading your skills...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFF0F5" barStyle="dark-content" />

      <Text style={styles.logo}>SkillQuest ♡</Text>
      <Text style={styles.subtitle}>Your journey to becoming better</Text>

      <View style={styles.headerCard}>
        <Text style={styles.welcome}>Keep Growing!</Text>
        <Text style={styles.headerText}>
          Your learning journey is saved and ready.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Add a New Skill</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter skill name"
          placeholderTextColor="#C28A9E"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter category"
          placeholderTextColor="#C28A9E"
          value={category}
          onChangeText={setCategory}
        />

        <TouchableOpacity style={styles.addButton} onPress={addSkill}>
          <Text style={styles.buttonText}>+ Add Skill</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Skills</Text>

      <FlatList
        data={skills}
        renderItem={renderSkill}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No skills yet. Add your first skill!</Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5', paddingTop: 55, paddingHorizontal: 20 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F5' },
  loadingText: { color: '#C74370', marginTop: 12 },
  logo: { fontSize: 29, fontWeight: 'bold', color: '#E75480' },
  subtitle: { color: '#A66A7E', marginTop: 5, marginBottom: 20 },
  headerCard: { backgroundColor: '#F7A8C4', padding: 22, borderRadius: 22, marginBottom: 22 },
  welcome: { fontSize: 23, fontWeight: 'bold', color: 'white' },
  headerText: { color: 'white', marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#C74370', marginBottom: 12 },
  form: { backgroundColor: 'white', padding: 15, borderRadius: 18, marginBottom: 22, elevation: 3 },
  input: { backgroundColor: '#FFF0F5', borderRadius: 12, padding: 13, marginBottom: 10, color: '#843B59' },
  addButton: { backgroundColor: '#E75480', padding: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 18, borderRadius: 18, marginBottom: 14, elevation: 3 },
  skillName: { fontSize: 18, fontWeight: 'bold', color: '#C74370' },
  category: { color: '#A66A7E', marginVertical: 7 },
  progressBackground: { height: 9, backgroundColor: '#FCE0EA', borderRadius: 10, overflow: 'hidden' },
  progress: { height: 9, backgroundColor: '#E75480', borderRadius: 10 },
  percent: { color: '#A66A7E', marginTop: 8, textAlign: 'right' },
  emptyText: { textAlign: 'center', color: '#A66A7E', padding: 20 },
});