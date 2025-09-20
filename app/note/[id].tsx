import { useNotes } from '@/hooks/useNotesStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import {
  ArrowLeft,
  Edit3,
  Trash2,
  Paperclip,

  Calendar,
  Clock,
  Bell,

  FileText,
  X,
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Image,

  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';



export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, subjects, updateNote, deleteNote, scheduleReminder, cancelReminder, reminders } = useNotes();
  const insets = useSafeAreaInsets();
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderDate, setReminderDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);


  const note = notes.find(n => n.id === id);
  const subject = note ? subjects.find(s => s.id === note.subjectId) : undefined;
  const noteReminder = note ? reminders.find(r => r.noteId === note.id && r.isActive) : undefined;

  useEffect(() => {
    if (note) {
      setReminderTitle(`Recordatorio: ${note.title}`);
      setReminderMessage(note.type === 'task' ? 'Es hora de trabajar en esta tarea' : 'Revisa estos apuntes');
    }
  }, [note]);

  if (!note) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Apunte no encontrado</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Apunte',
      '¿Estás seguro de que quieres eliminar este apunte?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteNote(note.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleToggleStatus = async () => {
    const newStatus = note.status === 'completed' ? 'pending' : 'completed';
    await updateNote(note.id, { status: newStatus });
  };

  const handleAddAttachment = () => {
    Alert.alert(
      'Agregar Archivo',
      'Selecciona el tipo de archivo que quieres agregar',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Imagen', onPress: pickImage },
        { text: 'Documento', onPress: pickDocument },
      ]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Se necesitan permisos para acceder a las imágenes');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const newAttachment = {
        id: Date.now().toString(),
        name: asset.fileName || `image_${Date.now()}.jpg`,
        uri: asset.uri,
        type: 'image' as const,
        size: asset.fileSize,
      };

      await updateNote(note.id, {
        attachments: [...note.attachments, newAttachment],
      });
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newAttachment = {
          id: Date.now().toString(),
          name: asset.name,
          uri: asset.uri,
          type: 'document' as const,
          size: asset.size,
        };

        await updateNote(note.id, {
          attachments: [...note.attachments, newAttachment],
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  const removeAttachment = (attachmentId: string) => {
    Alert.alert(
      'Eliminar Archivo',
      '¿Estás seguro de que quieres eliminar este archivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const updatedAttachments = note.attachments.filter(a => a.id !== attachmentId);
            await updateNote(note.id, { attachments: updatedAttachments });
          },
        },
      ]
    );
  };

  const handleScheduleReminder = async () => {
    if (!reminderTitle.trim() || !reminderMessage.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (reminderDate <= new Date()) {
      Alert.alert('Error', 'La fecha del recordatorio debe ser futura');
      return;
    }

    try {
      await scheduleReminder(note.id, reminderTitle.trim(), reminderMessage.trim(), reminderDate);
      setShowReminderModal(false);
      Alert.alert('Éxito', 'Recordatorio programado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo programar el recordatorio');
    }
  };

  const handleCancelReminder = () => {
    if (noteReminder) {
      Alert.alert(
        'Cancelar Recordatorio',
        '¿Estás seguro de que quieres cancelar este recordatorio?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí, cancelar',
            style: 'destructive',
            onPress: () => cancelReminder(noteReminder.id),
          },
        ]
      );
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const renderAttachment = (attachment: typeof note.attachments[0]) => (
    <View key={attachment.id} style={styles.attachmentItem}>
      {attachment.type === 'image' ? (
        <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
      ) : (
        <View style={styles.documentIcon}>
          <FileText size={24} color={Colors.light.tint} />
        </View>
      )}
      
      <View style={styles.attachmentInfo}>
        <Text style={styles.attachmentName} numberOfLines={1}>
          {attachment.name}
        </Text>
        {attachment.size && (
          <Text style={styles.attachmentSize}>
            {formatFileSize(attachment.size)}
          </Text>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.removeAttachmentButton}
        onPress={() => removeAttachment(attachment.id)}
      >
        <X size={16} color={Colors.light.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push(`/note/edit/${note.id}`)}
              >
                <Edit3 size={20} color={Colors.light.tint} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleDelete}
              >
                <Trash2 size={20} color={Colors.light.danger} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{note.title}</Text>
          
          {subject && (
            <View style={[styles.subjectTag, { backgroundColor: subject.color }]}>
              <Text style={styles.subjectText}>{subject.name}</Text>
            </View>
          )}
          
          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Calendar size={16} color={Colors.light.gray} />
              <Text style={styles.metadataText}>
                {format(new Date(note.date), 'dd MMMM yyyy', { locale: es })}
              </Text>
            </View>
            
            <View style={styles.metadataItem}>
              <Clock size={16} color={Colors.light.gray} />
              <Text style={styles.metadataText}>{note.time}</Text>
            </View>
          </View>

          {note.className && (
            <Text style={styles.className}>Clase: {note.className}</Text>
          )}
        </View>

        {note.content && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contenido</Text>
            <Text style={styles.noteContent}>{note.content}</Text>
          </View>
        )}

        {note.attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Archivos Adjuntos</Text>
            {note.attachments.map(renderAttachment)}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleToggleStatus}>
            <Text style={styles.actionButtonText}>
              {note.status === 'completed' ? 'Marcar como Pendiente' : 'Marcar como Completado'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleAddAttachment}>
            <Paperclip size={16} color={Colors.light.tint} />
            <Text style={[styles.actionButtonText, { marginLeft: 8 }]}>
              Agregar Archivo
            </Text>
          </TouchableOpacity>
          
          {noteReminder ? (
            <TouchableOpacity style={styles.actionButton} onPress={handleCancelReminder}>
              <Bell size={16} color={Colors.light.danger} />
              <Text style={[styles.actionButtonText, { marginLeft: 8, color: Colors.light.danger }]}>
                Cancelar Recordatorio
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowReminderModal(true)}>
              <Bell size={16} color={Colors.light.tint} />
              <Text style={[styles.actionButtonText, { marginLeft: 8 }]}>
                Programar Recordatorio
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showReminderModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReminderModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReminderModal(false)}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nuevo Recordatorio</Text>
            <TouchableOpacity onPress={handleScheduleReminder}>
              <Text style={styles.saveButton}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Título</Text>
              <TextInput
                style={styles.textInput}
                value={reminderTitle}
                onChangeText={setReminderTitle}
                placeholder="Título del recordatorio"
                placeholderTextColor={Colors.light.gray}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mensaje</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={reminderMessage}
                onChangeText={setReminderMessage}
                placeholder="Mensaje del recordatorio"
                placeholderTextColor={Colors.light.gray}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Fecha y Hora</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={16} color={Colors.light.tint} />
                <Text style={styles.dateButtonText}>
                  {format(reminderDate, 'dd MMMM yyyy HH:mm', { locale: es })}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={reminderDate}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setReminderDate(selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.secondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  subjectText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  metadata: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metadataText: {
    fontSize: 14,
    color: Colors.light.gray,
    marginLeft: 4,
  },
  className: {
    fontSize: 14,
    color: Colors.light.gray,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  noteContent: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  attachmentImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  attachmentSize: {
    fontSize: 12,
    color: Colors.light.gray,
    marginTop: 2,
  },
  removeAttachmentButton: {
    padding: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.secondary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.tint,
  },
  errorText: {
    fontSize: 18,
    color: Colors.light.danger,
    textAlign: 'center',
    marginTop: 50,
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
    marginBottom: 20,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 8,
  },
});