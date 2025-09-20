import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Bell, Info, HelpCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      Alert.alert(
        'Desactivar Notificaciones',
        'Para desactivar las notificaciones, ve a la configuración de tu dispositivo.',
        [{ text: 'OK' }]
      );
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setNotificationsEnabled(true);
        Alert.alert(
          'Notificaciones Activadas',
          'Ahora recibirás recordatorios de tus apuntes y tareas.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Permisos Denegados',
          'Para recibir recordatorios, activa las notificaciones en la configuración de tu dispositivo.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const showAbout = () => {
    Alert.alert(
      'Acerca de la App',
      'Gestor de Apuntes v1.0\n\nUna aplicación completa para organizar tus apuntes, tareas y recordatorios académicos.\n\nDesarrollado con React Native y Expo.',
      [{ text: 'OK' }]
    );
  };

  const showHelp = () => {
    Alert.alert(
      'Ayuda',
      '• Crea materias para organizar tus apuntes\n• Añade apuntes y tareas con archivos adjuntos\n• Configura recordatorios para no olvidar fechas importantes\n• Marca tareas como completadas o urgentes\n• Busca y filtra tus apuntes fácilmente',
      [{ text: 'OK' }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingIcon}>
        <Text>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Text>{rightComponent}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <SettingItem
          icon={<Bell size={20} color={Colors.light.tint} />}
          title="Recordatorios"
          subtitle={notificationsEnabled ? 'Activados' : 'Desactivados'}
          onPress={toggleNotifications}
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: Colors.light.border, true: Colors.light.tint }}
              thumbColor="white"
            />
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>
        <SettingItem
          icon={<Info size={20} color={Colors.light.tint} />}
          title="Acerca de"
          subtitle="Información de la aplicación"
          onPress={showAbout}
        />
        <SettingItem
          icon={<HelpCircle size={20} color={Colors.light.tint} />}
          title="Ayuda"
          subtitle="Cómo usar la aplicación"
          onPress={showHelp}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Gestor de Apuntes v1.0
        </Text>
        <Text style={styles.footerSubtext}>
          Desarrollado con React Native
        </Text>
      </View>
    </ScrollView>
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
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.light.gray,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: Colors.light.gray,
  },
});