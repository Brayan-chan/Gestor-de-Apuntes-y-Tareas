import { useNotes } from '@/hooks/useNotesStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NoteCard from '@/components/NoteCard';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,

} from 'react-native';

export default function NotesScreen() {
  const { notes, subjects, updateNote } = useNotes();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'urgent'>('all');


  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.className?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(note => note.status === filterStatus);
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, searchQuery, filterStatus]);



  const toggleNoteStatus = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const newStatus = note.status === 'completed' ? 'pending' : 'completed';
      await updateNote(noteId, { status: newStatus });
    }
  };

  const getSubjectForNote = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId);
  };

  const renderNote = ({ item }: { item: typeof notes[0] }) => (
    <NoteCard
      note={item}
      subject={getSubjectForNote(item.subjectId)}
      onPress={() => router.push(`/note/${item.id}`)}
      onToggleStatus={() => toggleNoteStatus(item.id)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Mis Apuntes</Text>
      
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.light.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar apuntes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.light.gray}
        />
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed', 'urgent'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[
              styles.filterText,
              filterStatus === status && styles.filterTextActive
            ]}>
              {status === 'all' ? 'Todos' : 
               status === 'pending' ? 'Pendientes' :
               status === 'completed' ? 'Completados' : 'Urgentes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No hay apuntes</Text>
      <Text style={styles.emptyText}>
        {searchQuery || filterStatus !== 'all' 
          ? 'No se encontraron apuntes con los filtros aplicados'
          : 'Comienza creando tu primer apunte'
        }
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={filteredNotes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}

        contentContainerStyle={filteredNotes.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/note/new')}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
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
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: Colors.light.text,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.secondary,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.gray,
  },
  filterTextActive: {
    color: 'white',
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
});