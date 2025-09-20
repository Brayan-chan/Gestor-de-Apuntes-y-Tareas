import { useNotes } from '@/hooks/useNotesStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SubjectCard from '@/components/SubjectCard';
import Colors, { subjectColors } from '@/constants/colors';
import { router } from 'expo-router';
import { Plus, BookOpen } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Modal,
} from 'react-native';

export default function SubjectsScreen() {
  const { subjects, notes, addSubject, deleteSubject } = useNotes();
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(subjectColors[0]);

  const getNotesCountForSubject = (subjectId: string) => {
    return notes.filter(note => note.subjectId === subjectId).length;
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la materia');
      return;
    }

    try {
      await addSubject({
        name: newSubjectName.trim(),
        color: selectedColor,
      });
      
      setNewSubjectName('');
      setSelectedColor(subjectColors[0]);
      setShowAddModal(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la materia');
    }
  };

  const handleDeleteSubject = (subjectId: string, subjectName: string) => {
    const notesCount = getNotesCountForSubject(subjectId);
    
    Alert.alert(
      'Eliminar Materia',
      `¿Estás seguro de que quieres eliminar "${subjectName}"?${
        notesCount > 0 ? `\n\nEsto también eliminará ${notesCount} apunte(s) asociado(s).` : ''
      }`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteSubject(subjectId),
        },
      ]
    );
  };

  const renderSubject = ({ item }: { item: typeof subjects[0] }) => (
    <SubjectCard
      subject={item}
      noteCount={getNotesCountForSubject(item.id)}
      onPress={() => console.log('Subject details not implemented yet')}
      onMore={() => handleDeleteSubject(item.id, item.name)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <BookOpen size={64} color={Colors.light.gray} />
      <Text style={styles.emptyTitle}>No hay materias</Text>
      <Text style={styles.emptyText}>
        Crea tu primera materia para organizar tus apuntes
      </Text>
    </View>
  );

  const renderColorPicker = () => (
    <View style={styles.colorPicker}>
      <Text style={styles.colorPickerTitle}>Color de la materia:</Text>
      <View style={styles.colorOptions}>
        {subjectColors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.colorOptionSelected,
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Materias</Text>
        <Text style={styles.subtitle}>
          {subjects.length} {subjects.length === 1 ? 'materia' : 'materias'}
        </Text>
      </View>

      <FlatList
        data={subjects}
        renderItem={renderSubject}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={subjects.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nueva Materia</Text>
            <TouchableOpacity onPress={handleAddSubject}>
              <Text style={styles.saveButton}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre de la materia</Text>
              <TextInput
                style={styles.textInput}
                value={newSubjectName}
                onChangeText={setNewSubjectName}
                placeholder="Ej: Matemáticas, Historia..."
                placeholderTextColor={Colors.light.gray}
                autoFocus
              />
            </View>

            {renderColorPicker()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.secondary,
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.gray,
  },
  list: {
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  cancelButton: {
    fontSize: 16,
    color: Colors.light.gray,
  },
  saveButton: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  colorPicker: {
    marginBottom: 24,
  },
  colorPickerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 12,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: Colors.light.text,
  },
});