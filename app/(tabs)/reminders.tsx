import { useNotes } from '@/hooks/useNotesStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Clock, Trash2 } from 'lucide-react-native';
import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

export default function RemindersScreen() {
  const { reminders, notes, subjects, cancelReminder } = useNotes();
  const insets = useSafeAreaInsets();

  const activeReminders = reminders.filter(r => r.isActive);

  const getNoteForReminder = (noteId: string) => {
    return notes.find(n => n.id === noteId);
  };

  const getSubjectForNote = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId);
  };

  const handleCancelReminder = (reminderId: string, title: string) => {
    Alert.alert(
      'Cancelar Recordatorio',
      `¿Estás seguro de que quieres cancelar el recordatorio "${title}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => cancelReminder(reminderId),
        },
      ]
    );
  };

  const formatReminderDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 0) {
        return 'Vencido';
      } else if (diffInHours < 24) {
        return `En ${Math.round(diffInHours)} horas`;
      } else {
        return format(date, 'dd MMM yyyy HH:mm', { locale: es });
      }
    } catch {
      return dateString;
    }
  };

  const renderReminder = ({ item }: { item: typeof reminders[0] }) => {
    const note = getNoteForReminder(item.noteId);
    const subject = note ? getSubjectForNote(note.subjectId) : undefined;
    const isOverdue = new Date(item.scheduledDate) < new Date();

    return (
      <View style={[styles.reminderCard, isOverdue && styles.overdueCard]}>
        <View style={styles.reminderHeader}>
          <View style={styles.reminderIcon}>
            <Bell size={20} color={isOverdue ? Colors.light.danger : Colors.light.tint} />
          </View>
          
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {note && (
              <Text style={styles.noteTitle} numberOfLines={1}>
                {note.title}
              </Text>
            )}
            {subject && (
              <View style={[styles.subjectTag, { backgroundColor: subject.color }]}>
                <Text style={styles.subjectText}>{subject.name}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleCancelReminder(item.id, item.title)}
          >
            <Trash2 size={18} color={Colors.light.danger} />
          </TouchableOpacity>
        </View>

        <Text style={styles.reminderMessage}>{item.message}</Text>
        
        <View style={styles.reminderFooter}>
          <View style={styles.timeContainer}>
            <Clock size={14} color={Colors.light.gray} />
            <Text style={[styles.timeText, isOverdue && styles.overdueText]}>
              {formatReminderDate(item.scheduledDate)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Bell size={64} color={Colors.light.gray} />
      <Text style={styles.emptyTitle}>No hay recordatorios</Text>
      <Text style={styles.emptyText}>
        Los recordatorios que configures en tus apuntes aparecerán aquí
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Recordatorios</Text>
        <Text style={styles.subtitle}>
          {activeReminders.length} {activeReminders.length === 1 ? 'recordatorio activo' : 'recordatorios activos'}
        </Text>
      </View>

      <FlatList
        data={activeReminders}
        renderItem={renderReminder}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={activeReminders.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />
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
    paddingBottom: 20,
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
  reminderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.danger,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  noteTitle: {
    fontSize: 14,
    color: Colors.light.gray,
    marginBottom: 6,
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  subjectText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  reminderMessage: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  reminderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: Colors.light.gray,
    marginLeft: 4,
  },
  overdueText: {
    color: Colors.light.danger,
    fontWeight: '500',
  },
});