import { Note, Subject } from '@/types';
import Colors from '@/constants/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, FileText, CheckCircle, AlertCircle, Paperclip } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NoteCardProps {
  note: Note;
  subject?: Subject;
  onPress: () => void;
  onToggleStatus?: () => void;
}

export default function NoteCard({ note, subject, onPress, onToggleStatus }: NoteCardProps) {
  const getStatusIcon = () => {
    switch (note.status) {
      case 'completed':
        return <CheckCircle size={20} color={Colors.light.success} />;
      case 'urgent':
        return <AlertCircle size={20} color={Colors.light.danger} />;
      default:
        return <Clock size={20} color={Colors.light.warning} />;
    }
  };

  const getStatusColor = () => {
    switch (note.status) {
      case 'completed':
        return Colors.light.success;
      case 'urgent':
        return Colors.light.danger;
      default:
        return Colors.light.warning;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.typeIcon, { backgroundColor: note.type === 'task' ? Colors.light.warning : Colors.light.tint }]}>
            <FileText size={16} color="white" />
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {note.title}
          </Text>
          {onToggleStatus && (
            <TouchableOpacity onPress={onToggleStatus} style={styles.statusButton}>
              {getStatusIcon()}
            </TouchableOpacity>
          )}
        </View>
        
        {subject && (
          <View style={[styles.subjectTag, { backgroundColor: subject.color }]}>
            <Text style={styles.subjectText}>{subject.name}</Text>
          </View>
        )}
      </View>

      {note.content && (
        <Text style={styles.content} numberOfLines={2}>
          {note.content}
        </Text>
      )}

      {note.className && (
        <Text style={styles.className}>Clase: {note.className}</Text>
      )}

      <View style={styles.footer}>
        <View style={styles.dateTime}>
          <Text style={styles.date}>{formatDate(note.date)}</Text>
          <Text style={styles.time}>{note.time}</Text>
        </View>
        
        <View style={styles.indicators}>
          {note.attachments.length > 0 && (
            <View style={styles.attachmentIndicator}>
              <Paperclip size={14} color={Colors.light.gray} />
              <Text style={styles.attachmentCount}>{note.attachments.length}</Text>
            </View>
          )}
          
          {note.reminderDate && (
            <View style={styles.reminderIndicator}>
              <Clock size={14} color={Colors.light.tint} />
            </View>
          )}
        </View>
      </View>

      <View style={[styles.statusBar, { backgroundColor: getStatusColor() }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
    position: 'relative',
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  statusButton: {
    padding: 4,
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 40,
  },
  subjectText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    fontSize: 14,
    color: Colors.light.gray,
    lineHeight: 20,
    marginBottom: 8,
  },
  className: {
    fontSize: 12,
    color: Colors.light.gray,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: Colors.light.gray,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: Colors.light.gray,
    fontWeight: '500',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentCount: {
    fontSize: 12,
    color: Colors.light.gray,
    marginLeft: 4,
  },
  reminderIndicator: {
    padding: 2,
  },
  statusBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
});