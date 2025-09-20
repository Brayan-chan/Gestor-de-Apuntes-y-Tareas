import { Subject } from '@/types';
import Colors from '@/constants/colors';
import { BookOpen, MoreVertical } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SubjectCardProps {
  subject: Subject;
  noteCount: number;
  onPress: () => void;
  onMore: () => void;
}

export default function SubjectCard({ subject, noteCount, onPress, onMore }: SubjectCardProps) {
  return (
    <TouchableOpacity style={[styles.container, { borderLeftColor: subject.color }]} onPress={onPress}>
      <View style={styles.content}>
        <View style={[styles.icon, { backgroundColor: subject.color }]}>
          <BookOpen size={20} color="white" />
        </View>
        
        <View style={styles.info}>
          <Text style={styles.name}>{subject.name}</Text>
          <Text style={styles.noteCount}>
            {noteCount} {noteCount === 1 ? 'apunte' : 'apuntes'}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.moreButton} onPress={onMore}>
          <MoreVertical size={20} color={Colors.light.gray} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  noteCount: {
    fontSize: 14,
    color: Colors.light.gray,
  },
  moreButton: {
    padding: 8,
  },
});