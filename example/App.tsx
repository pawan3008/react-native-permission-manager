import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  PermissionGate,
  PermissionProvider,
  usePermission,
  usePermissionGroup,
  type PermissionInput,
} from 'react-native-permission-manager';

type ScreenId =
  'home' | 'camera' | 'microphone' | 'photos' | 'notification' | 'location' | 'contacts' | 'groups';

const SCREENS: { id: ScreenId; title: string; permission?: PermissionInput }[] = [
  { id: 'camera', title: 'Camera', permission: 'camera' },
  { id: 'microphone', title: 'Microphone', permission: 'microphone' },
  { id: 'photos', title: 'Photos', permission: 'photos' },
  { id: 'notification', title: 'Notifications', permission: 'notification' },
  { id: 'location', title: 'Location', permission: 'location' },
  { id: 'contacts', title: 'Contacts', permission: 'contacts' },
  { id: 'groups', title: 'Permission Groups' },
];

const COLORS = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceAlt: '#334155',
  primary: '#38BDF8',
  primaryDark: '#0284C8',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  success: '#4ADE80',
  danger: '#F87171',
  warning: '#FBBF24',
};

function statusColor(status?: string): string {
  switch (status) {
    case 'GRANTED':
    case 'LIMITED':
      return COLORS.success;
    case 'DENIED':
    case 'NOT_DETERMINED':
      return COLORS.warning;
    case 'BLOCKED':
    case 'UNAVAILABLE':
      return COLORS.danger;
    default:
      return COLORS.textMuted;
  }
}

function PermissionDetailScreen({
  title,
  permission,
  onBack,
}: {
  title: string;
  permission: PermissionInput;
  onBack: () => void;
}): JSX.Element {
  const { status, loading, granted, request, check, ensure, openSettings } = usePermission(
    permission,
    {
      title: `${title} access`,
      message: `We need ${title.toLowerCase()} access for this demo feature.`,
      showRationale: true,
    },
  );

  return (
    <ScrollView contentContainerStyle={styles.screenPad}>
      <Pressable onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.screenTitle}>{title}</Text>
      <Text style={styles.caption}>Live status updates when you return from Settings.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Status</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <Text style={[styles.status, { color: statusColor(status) }]}>{status ?? 'UNKNOWN'}</Text>
        )}
        <Text style={styles.caption}>{granted ? 'Access granted' : 'Access not granted'}</Text>
      </View>

      <View style={styles.row}>
        <ActionButton label="Check" onPress={() => void check()} />
        <ActionButton label="Request" onPress={() => void request()} primary />
      </View>
      <View style={styles.row}>
        <ActionButton label="Ensure" onPress={() => void ensure()} />
        <ActionButton label="Settings" onPress={() => void openSettings()} />
      </View>

      <PermissionGate
        permission={permission}
        autoRequest={false}
        renderFallback={({ request: req, ensure: ens, openSettings: open }) => (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.label}>PermissionGate fallback</Text>
            <Text style={styles.caption}>Children render only when granted.</Text>
            <View style={styles.row}>
              <ActionButton label="Request" onPress={() => void req()} primary />
              <ActionButton label="Ensure" onPress={() => void ens()} />
            </View>
            <ActionButton label="Open Settings" onPress={() => void open()} />
          </View>
        )}
      >
        <View style={[styles.card, { marginTop: 16, borderColor: COLORS.success, borderWidth: 1 }]}>
          <Text style={[styles.label, { color: COLORS.success }]}>Protected content unlocked</Text>
          <Text style={styles.caption}>This is what a gated screen looks like for {title}.</Text>
        </View>
      </PermissionGate>
    </ScrollView>
  );
}

function GroupsScreen({ onBack }: { onBack: () => void }): JSX.Element {
  const { results, allGranted, anyGranted, loading, check, request } = usePermissionGroup('media');

  return (
    <ScrollView contentContainerStyle={styles.screenPad}>
      <Pressable onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Permission Groups</Text>
      <Text style={styles.caption}>
        The built-in `media` group bundles camera + microphone + photos. Use{' '}
        {"usePermissionGroup('media')"} to check/request them together.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Group status</Text>
        <Text style={[styles.status, { color: statusColor(allGranted ? 'GRANTED' : 'DENIED') }]}>
          {allGranted ? 'All granted' : anyGranted ? 'Partially granted' : 'Not granted'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : (
        results.map(result => (
          <View key={result.type} style={styles.card}>
            <Text style={styles.label}>{result.type}</Text>
            <Text style={[styles.status, { color: statusColor(result.status) }]}>
              {result.status}
            </Text>
          </View>
        ))
      )}

      <View style={styles.row}>
        <ActionButton label="Check all" onPress={() => void check()} />
        <ActionButton label="Request all" onPress={() => void request()} primary />
      </View>
    </ScrollView>
  );
}

function Home({ onNavigate }: { onNavigate: (id: ScreenId) => void }): JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.screenPad}>
      <Text style={styles.brand}>Permission Manager</Text>
      <Text style={styles.caption}>Try check / request / ensure for each permission.</Text>
      {SCREENS.map(screen => (
        <Pressable
          key={screen.id}
          style={({ pressed }) => [styles.navCard, pressed && { opacity: 0.85 }]}
          onPress={() => onNavigate(screen.id)}
        >
          <Text style={styles.navTitle}>{screen.title}</Text>
          <Text style={styles.navChevron}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function ActionButton({
  label,
  onPress,
  primary,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export default function App(): JSX.Element {
  const [screen, setScreen] = React.useState<ScreenId>('home');
  const current = SCREENS.find(s => s.id === screen);

  return (
    <PermissionProvider
      watchedPermissions={[
        'camera',
        'microphone',
        'photos',
        'notification',
        'location',
        'contacts',
      ]}
    >
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" />
        {screen === 'home' && <Home onNavigate={setScreen} />}
        {screen === 'groups' && <GroupsScreen onBack={() => setScreen('home')} />}
        {current?.permission != null && screen !== 'home' && screen !== 'groups' && (
          <PermissionDetailScreen
            title={current.title}
            permission={current.permission}
            onBack={() => setScreen('home')}
          />
        )}
      </SafeAreaView>
    </PermissionProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screenPad: {
    padding: 20,
    paddingBottom: 40,
  },
  brand: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  screenTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  caption: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  navCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  navChevron: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '300',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  status: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primaryDark,
  },
  buttonSecondary: {
    backgroundColor: COLORS.surfaceAlt,
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  backBtn: {
    marginBottom: 12,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
