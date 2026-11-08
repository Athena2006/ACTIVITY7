import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Animated, StatusBar
} from 'react-native';

const skills = [
  { id: '1', name: 'React Native', category: 'Programming', progress: 65 },
  { id: '2', name: 'Graphic Design', category: 'Creativity', progress: 40 },
  { id: '3', name: 'Photography', category: 'Art', progress: 80 },
];

export default function App() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderSkill = ({ item }) => (
    <Animated.View
      style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.skillName}>{item.name}</Text>
      <Text style={styles.category}>{item.category}</Text>
      <View style={styles.progressBackground}>
        <View style={[styles.progress, { width: `${item.progress}%` }]} />
      </View>
      <Text style={styles.percent}>{item.progress}% completed</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFF0F5" barStyle="dark-content" />

      <Text style={styles.logo}>SkillQuest ♡</Text>
      <Text style={styles.subtitle}>Your journey to becoming better</Text>

      <View style={styles.headerCard}>
        <Text style={styles.welcome}>Keep Growing!</Text>
        <Text style={styles.headerText}>
          Every skill you learn brings you one step closer to your goals.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>My Skills</Text>

      <FlatList
        data={skills}
        renderItem={renderSkill}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    paddingTop: 55,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 29,
    fontWeight: 'bold',
    color: '#E75480',
  },
  subtitle: {
    color: '#A66A7E',
    marginTop: 5,
    marginBottom: 20,
  },
  headerCard: {
    backgroundColor: '#F7A8C4',
    padding: 22,
    borderRadius: 22,
    marginBottom: 25,
  },
  welcome: {
    fontSize: 23,
    fontWeight: 'bold',
    color: 'white',
  },
  headerText: {
    color: 'white',
    marginTop: 8,
    lineHeight: 21,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#C74370',
    marginBottom: 15,
  },
  card: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    elevation: 3,
  },
  skillName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C74370',
  },
  category: {
    color: '#A66A7E',
    marginVertical: 7,
  },
  progressBackground: {
    height: 9,
    backgroundColor: '#FCE0EA',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progress: {
    height: 9,
    backgroundColor: '#E75480',
    borderRadius: 10,
  },
  percent: {
    color: '#A66A7E',
    marginTop: 8,
    textAlign: 'right',
  },
});