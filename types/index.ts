export interface Subject {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  uri: string;
  type: 'image' | 'document';
  size?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  className?: string;
  date: string;
  time: string;
  status: 'pending' | 'completed' | 'urgent';
  type: 'note' | 'task';
  attachments: Attachment[];
  reminderDate?: string;
  notificationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  noteId: string;
  title: string;
  message: string;
  scheduledDate: string;
  notificationId: string;
  isActive: boolean;
}