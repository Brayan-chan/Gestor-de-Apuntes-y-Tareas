import { useNotes } from '@/hooks/useNotesStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors, { subjectColors } from '@/constants/colors';
import { router, Stack } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Paperclip,
  X,
  FileText,

  Plus,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  Modal,
  Image,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Attachment } from '@/types';

export default function NewNoteScreen() {
  const { subjects, addNote, addSubject } = useNotes();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [className, setClassName] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [type, setType] = useState<'note' | 'task'>('note');
  const [status, setStatus] = useState<'pending' | 'completed' | 'urgent'>('pending');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(subjectColors[0]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título');
      return;
    }

    if (!selectedSubjectId) {
      Alert.alert('Error', 'Por favor selecciona una materia');
      return;
    }

    try {
      await addNote({
        title: title.trim(),
        content: content.trim(),
        subjectId: selectedSubjectId,
        className: className.trim() || undefined,
        date: date.toISOString(),
        time,
        type,
        status,
        attachments,
      });

      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el apunte');
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la materia');
      return;
    }

    try {
      const subject = await addSubject({
        name: newSubjectName.trim(),
        color: newSubjectColor,
      });
      
      setSelectedSubjectId(subject.id);
      setNewSubjectName('');
      setNewSubjectColor(subjectColors[0]);
      setShowSubjectModal(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la materia');
    }
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
      const newAttachment: Attachment = {
        id: Date.now().toString(),
        name: asset.fileName || `image_${Date.now()}.jpg`,
        uri: asset.uri,
        type: 'image',
        size: asset.fileSize,
      };

      setAttachments([...attachments, newAttachment]);
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
        const newAttachment: Attachment = {
          id: Date.now().toString(),
          name: asset.name,
          uri: asset.uri,
          type: 'document',
          size: asset.size,
        };

        setAttachments([...attachments, newAttachment]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter(a => a.id !== attachmentId));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const renderAttachment = (attachment: Attachment) => (
    <View key={attachment.id} style={styles.attachmentItem}>
      {attachment.type === 'image' ? (
        <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
      ) : (
        <View style={styles.documentIcon}>
          <FileText size={20} color={Colors.light.tint} />
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
          title: 'Nuevo Apunte',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Guardar</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Título del apunte"
            placeholderTextColor={Colors.light.gray}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'note' && styles.typeButtonActive]}
              onPress={() => setType('note')}
            >
              <Text style={[styles.typeButtonText, type === 'note' && styles.typeButtonTextActive]}>
                Apunte
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === 'task' && styles.typeButtonActive]}
              onPress={() => setType('task')}
            >
              <Text style={[styles.typeButtonText, type === 'task' && styles.typeButtonTextActive]}>
                Tarea
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Materia *</Text>
          <View style={styles.subjectSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.subjectChip,
                    { backgroundColor: subject.color },
                    selectedSubjectId === subject.id && styles.subjectChipSelected,
                  ]}
                  onPress={() => setSelectedSubjectId(subject.id)}
                >
                  <Text style={styles.subjectChipText}>{subject.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addSubjectButton}
                onPress={() => setShowSubjectModal(true)}
              >
                <Plus size={16} color={Colors.light.tint} />
                <Text style={styles.addSubjectText}>Nueva</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Clase (opcional)</Text>
          <TextInput
            style={styles.textInput}
            value={className}
            onChangeText={setClassName}
            placeholder="Nombre de la clase"
            placeholderTextColor={Colors.light.gray}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Fecha y Hora</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={16} color={Colors.light.tint} />
              <Text style={styles.dateTimeText}>
                {format(date, 'dd MMM yyyy', { locale: es })}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Clock size={16} color={Colors.light.tint} />
              <Text style={styles.dateTimeText}>{time}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {type === 'task' && (
          <View style={styles.section}>
            <Text style={styles.label}>Estado</Text>
            <View style={styles.statusSelector}>
              {(['pending', 'urgent', 'completed'] as const).map((statusOption) => (
                <TouchableOpacity
                  key={statusOption}
                  style={[
                    styles.statusButton,
                    status === statusOption && styles.statusButtonActive,
                  ]}
                  onPress={() => setStatus(statusOption)}
                >
                  <Text style={[
                    styles.statusButtonText,
                    status === statusOption && styles.statusButtonTextActive,
                  ]}>
                    {statusOption === 'pending' ? 'Pendiente' :
                     statusOption === 'urgent' ? 'Urgente' : 'Completado'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Contenido</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder="Escribe el contenido del apunte..."
            placeholderTextColor={Colors.light.gray}
            multiline
            numberOfLines={6}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.attachmentHeader}>
            <Text style={styles.label}>Archivos Adjuntos</Text>
            <TouchableOpacity
              style={styles.addAttachmentButton}
              onPress={handleAddAttachment}
            >
              <Paperclip size={16} color={Colors.light.tint} />
              <Text style={styles.addAttachmentText}>Agregar</Text>
            </TouchableOpacity>
          </View>
          
          {attachments.length > 0 && (
            <View style={styles.attachmentsList}>
              {attachments.map(renderAttachment)}
            </View>
          )}
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${time}:00`)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setTime(format(selectedTime, 'HH:mm'));
            }
          }}
        />
      )}

      <Modal
        visible={showSubjectModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSubjectModal(false)}>
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

            <View style={styles.colorPicker}>
              <Text style={styles.inputLabel}>Color de la materia:</Text>
              <View style={styles.colorOptions}>
                {subjectColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newSubjectColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewSubjectColor(color)}
                  />
                ))}
              </View>
            </View>
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
  saveButton: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  label: {
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
    height: 120,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.gray,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  subjectSelector: {
    marginTop: 4,
  },
  subjectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subjectChipSelected: {
    borderColor: Colors.light.text,
  },
  subjectChipText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  addSubjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.light.secondary,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderStyle: 'dashed',
  },
  addSubjectText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.light.secondary,
  },
  dateTimeText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  statusSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: Colors.light.warning,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.gray,
  },
  statusButtonTextActive: {
    color: 'white',
  },
  attachmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addAttachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addAttachmentText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  attachmentsList: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.secondary,
    borderRadius: 8,
    padding: 8,
  },
  attachmentImage: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginRight: 8,
  },
  documentIcon: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  attachmentSize: {
    fontSize: 10,
    color: Colors.light.gray,
    marginTop: 1,
  },
  removeAttachmentButton: {
    padding: 4,
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
  colorPicker: {
    marginBottom: 24,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: Colors.light.text,
  },
});