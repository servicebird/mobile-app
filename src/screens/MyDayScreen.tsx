import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Card, ErrorView, Loading, styles as ui } from '../components/ui';
import { VisitCard } from '../components/VisitCard';
import { dayLabel, initials, plural } from '../format';
import type { ScreenProps } from '../navigation';
import { useSession } from '../session';
import { getMyVisits, getUserName } from '../sf/serviceBird';
import { cardShadow, colors, radius, touch } from '../theme';
import { useLoad } from '../useLoad';

export function MyDayScreen({ navigation }: ScreenProps<'MyDay'>) {
  const session = useSession();
  const [offset, setOffset] = useState(0);
  const [userName, setUserName] = useState('');

  const day = new Date();
  day.setDate(day.getDate() + offset);
  const dayKey = day.toDateString();

  const load = useCallback(() => getMyVisits(session.userId, new Date(dayKey)), [session.userId, dayKey]);
  const { data: visits, error, refreshing, refresh, reload } = useLoad(load);

  React.useEffect(() => {
    getUserName(session.userId).then(setUserName).catch(() => {});
  }, [session.userId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <Avatar name={userName} onSignOut={session.signOut} />,
    });
  }, [navigation, userName, session.signOut]);

  const nextVisit = visits?.find(v => v.status === 'Scheduled');
  const doneCount = visits?.filter(v => v.status === 'Done').length ?? 0;

  return (
    <ScrollView
      style={ui.screen}
      contentContainerStyle={ui.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}>
      <View style={s.day}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous day" onPress={() => setOffset(o => o - 1)} style={s.dayBtn}>
          <Icon name="back" size={22} color={colors.brand} strokeWidth={2.2} />
        </Pressable>
        <View style={s.dayMid}>
          <Text style={s.dayLabel}>{dayLabel(day)}</Text>
          <Text style={[ui.muted, { fontSize: 14 }]}>
            {visits ? `${plural(visits.length, 'visit')} · ${doneCount} done` : ' '}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Next day" onPress={() => setOffset(o => o + 1)} style={s.dayBtn}>
          <Icon name="forward" size={22} color={colors.brand} strokeWidth={2.2} />
        </Pressable>
      </View>

      {error && <ErrorView message={error} onRetry={reload} />}
      {!error && !visits && <Loading />}

      {visits?.map(v => (
        <VisitCard
          key={v.id}
          visit={v}
          isNext={nextVisit?.id === v.id}
          onPress={() => navigation.navigate('Visit', { visitId: v.id })}
        />
      ))}

      {visits?.length === 0 && (
        <Card style={s.empty}>
          <Icon name="calendar" size={40} color={colors.textWeak} strokeWidth={1.8} />
          <Text style={s.emptyTitle}>No visits this day</Text>
          <Text style={[ui.muted, s.emptyText]}>Your dispatcher hasn't scheduled anything for you yet.</Text>
        </Card>
      )}
    </ScrollView>
  );
}

function Avatar({ name, onSignOut }: { name: string; onSignOut: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Signed in as ${name}. Log out`}
      onPress={() =>
        Alert.alert('Log out?', name, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log out', style: 'destructive', onPress: onSignOut },
        ])
      }
      style={s.avatar}>
      <Text style={s.avatarText}>{initials(name) || '?'}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  day: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    padding: 2,
    ...cardShadow,
  },
  dayBtn: { width: touch, height: touch, alignItems: 'center', justifyContent: 'center' },
  dayMid: { alignItems: 'center' },
  dayLabel: { fontWeight: '700', fontSize: 17, color: colors.text },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyTitle: { fontWeight: '700', fontSize: 17, color: colors.text },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
