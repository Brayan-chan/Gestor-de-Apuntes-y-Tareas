
import createContextHook from '@nkzw/create-context-hook';
import * as Notifications from 'expo-notifications';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { Note, Subject, Reminder } from '@/types';

// Storage abstraction
const storage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    }
  },
};

const NOTES_KEY = 'notes';
const SUBJECTS_KEY = 'subjects';
const REMINDERS_KEY = 'reminders';

export const [NotesProvider, useNotes] = createContextHook(() => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [notesData, subjectsData, remindersData] = await Promise.all([
        storage.getItem(NOTES_KEY),
        storage.getItem(SUBJECTS_KEY),
        storage.getItem(REMINDERS_KEY),
      ]);

      if (notesData) setNotes(JSON.parse(notesData));
      if (subjectsData) setSubjects(JSON.parse(subjectsData));
      if (remindersData) setReminders(JSON.parse(remindersData));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveNotes = useCallback(async (newNotes: Note[]) => {
    if (!newNotes || !Array.isArray(newNotes)) return;
    try {
      await storage.setItem(NOTES_KEY, JSON.stringify(newNotes));
      setNotes(newNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }, []);

  const saveSubjects = useCallback(async (newSubjects: Subject[]) => {
    if (!newSubjects || !Array.isArray(newSubjects)) return;
    try {
      await storage.setItem(SUBJECTS_KEY, JSON.stringify(newSubjects));
      setSubjects(newSubjects);
    } catch (error) {
      console.error('Error saving subjects:', error);
    }
  }, []);

  const saveReminders = useCallback(async (newReminders: Reminder[]) => {
    if (!newReminders || !Array.isArray(newReminders)) return;
    try {
      await storage.setItem(REMINDERS_KEY, JSON.stringify(newReminders));
      setReminders(newReminders);
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  }, []);

  // Notes CRUD
  const addNote = useCallback(async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...note,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedNotes = [...notes, newNote];
    await saveNotes(updatedNotes);
    return newNote;
  }, [notes, saveNotes]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note =>
      note.id === id
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    );
    await saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const deleteNote = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note?.notificationId && Platform.OS !== 'web') {
      await Notifications.cancelScheduledNotificationAsync(note.notificationId);
    }
    
    const updatedNotes = notes.filter(note => note.id !== id);
    await saveNotes(updatedNotes);
    
    // Remove associated reminders
    const updatedReminders = reminders.filter(r => r.noteId !== id);
    await saveReminders(updatedReminders);
  }, [notes, reminders, saveNotes, saveReminders]);

  // Subjects CRUD
  const addSubject = useCallback(async (subject: Omit<Subject, 'id' | 'createdAt'>) => {
    const newSubject: Subject = {
      ...subject,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    const updatedSubjects = [...subjects, newSubject];
    await saveSubjects(updatedSubjects);
    return newSubject;
  }, [subjects, saveSubjects]);

  const updateSubject = useCallback(async (id: string, updates: Partial<Subject>) => {
    const updatedSubjects = subjects.map(subject =>
      subject.id === id ? { ...subject, ...updates } : subject
    );
    await saveSubjects(updatedSubjects);
  }, [subjects, saveSubjects]);

  const deleteSubject = useCallback(async (id: string) => {
    const updatedSubjects = subjects.filter(subject => subject.id !== id);
    await saveSubjects(updatedSubjects);
    
    // Delete notes associated with this subject
    const updatedNotes = notes.filter(note => note.subjectId !== id);
    await saveNotes(updatedNotes);
  }, [subjects, notes, saveSubjects, saveNotes]);

  // Reminders
  const scheduleReminder = useCallback(async (noteId: string, title: string, message: string, date: Date) => {
    try {
      let notificationId = '';
      
      if (Platform.OS !== 'web') {
        notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body: message,
            sound: true,
          },
          trigger: date as any,
        });
      }

      const reminder: Reminder = {
        id: Date.now().toString(),
        noteId,
        title,
        message,
        scheduledDate: date.toISOString(),
        notificationId,
        isActive: true,
      };

      const updatedReminders = [...reminders, reminder];
      await saveReminders(updatedReminders);

      // Update note with notification ID
      await updateNote(noteId, { 
        reminderDate: date.toISOString(),
        notificationId 
      });

      return reminder;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      throw error;
    }
  }, [reminders, saveReminders, updateNote]);

  const cancelReminder = useCallback(async (reminderId: string) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      if (reminder.notificationId && Platform.OS !== 'web') {
        await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      }
      
      const updatedReminders = reminders.filter(r => r.id !== reminderId);
      await saveReminders(updatedReminders);
      
      // Remove reminder from note
      const note = notes.find(n => n.id === reminder.noteId);
      if (note) {
        await updateNote(note.id, { 
          reminderDate: undefined,
          notificationId: undefined 
        });
      }
    }
  }, [reminders, notes, saveReminders, updateNote]);

  const initializeSampleData = useCallback(async () => {
    try {
      // Create sample subjects
      const mathSubject = await addSubject({
        name: 'Matemáticas',
        color: '#007AFF',
      });
      
      const historySubject = await addSubject({
        name: 'Historia',
        color: '#34C759',
      });
      
      const physicsSubject = await addSubject({
        name: 'Física',
        color: '#FF9500',
      });

      // Create sample notes
      await addNote({
        title: 'Ecuaciones Cuadráticas',
        content: 'Las ecuaciones cuadráticas tienen la forma ax² + bx + c = 0. Para resolverlas podemos usar la fórmula cuadrática: x = (-b ± √(b²-4ac)) / 2a',
        subjectId: mathSubject.id,
        className: 'Álgebra II',
        date: new Date().toISOString(),
        time: '10:00',
        type: 'note',
        status: 'pending',
        attachments: [],
      });

      await addNote({
        title: 'Tarea: Resolver ejercicios 1-10',
        content: 'Completar los ejercicios del capítulo 5, páginas 120-125. Entregar el viernes.',
        subjectId: mathSubject.id,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        time: '23:59',
        type: 'task',
        status: 'urgent',
        attachments: [],
      });

      await addNote({
        title: 'La Revolución Francesa',
        content: 'Causas: Crisis económica, desigualdad social, ideas ilustradas. Desarrollo: Estados Generales (1789), Toma de la Bastilla, Declaración de Derechos.',
        subjectId: historySubject.id,
        className: 'Historia Moderna',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
        time: '14:30',
        type: 'note',
        status: 'completed',
        attachments: [],
      });

      await addNote({
        title: 'Leyes de Newton',
        content: '1ª Ley (Inercia): Un objeto en reposo permanece en reposo. 2ª Ley: F = ma. 3ª Ley: Acción y reacción.',
        subjectId: physicsSubject.id,
        className: 'Mecánica Clásica',
        date: new Date().toISOString(),
        time: '11:15',
        type: 'note',
        status: 'pending',
        attachments: [],
      });

    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }, [addSubject, addNote]);

  // Initialize with sample data if empty
  useEffect(() => {
    if (!isLoading && subjects.length === 0 && notes.length === 0) {
      initializeSampleData();
    }
  }, [isLoading, subjects.length, notes.length, initializeSampleData]);

  return useMemo(() => ({
    notes,
    subjects,
    reminders,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    addSubject,
    updateSubject,
    deleteSubject,
    scheduleReminder,
    cancelReminder,
    initializeSampleData,
  }), [
    notes,
    subjects,
    reminders,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    addSubject,
    updateSubject,
    deleteSubject,
    scheduleReminder,
    cancelReminder,
    initializeSampleData,
  ]);
});