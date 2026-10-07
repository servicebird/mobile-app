import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { Icon } from '../components/Icon';
import { Button, Card, ErrorView, Footer, Loading, SectionLabel, styles as ui } from '../components/ui';
import { VisitCard } from '../components/VisitCard';
import { money, plural } from '../format';
import type { ScreenProps } from '../navigation';
import { useSession } from '../session';
import { getMyVisits, getVisitDetail } from '../sf/serviceBird';
import { colors } from '../theme';
import { useLoad } from '../useLoad';

export function DoneScreen({ navigation, route }: ScreenProps<'Done'>) {
  const { visitId, signedBy } = route.params;
  const session = useSession();
  const load = useCallback(async () => {
    const [visit, today] = await Promise.all([getVisitDetail(visitId), getMyVisits(session.userId, new Date())]);
    return { visit, next: today.find(x => x.id !== visitId && x.status === 'Scheduled') };
  }, [visitId, session.userId]);
  const { data, error, reload } = useLoad(load);

  if (error) {
    return <ErrorView message={error} onRetry={reload} />;
  }
  if (!data) {
    return <Loading />;
  }
  const { visit: v, next } = data;
  const total = v.charges.reduce((sum, c) => sum + c.amount, 0);

  return (
    <View style={ui.screen}>
      <ScrollView contentContainerStyle={[ui.scroll, { gap: 16 }]}>
        <View style={s.hero}>
          <View style={s.badge}>
            <Icon name="check" size={44} color="#FFFFFF" strokeWidth={2.6} />
          </View>
          <Text style={s.title}>Visit done</Text>
          <Text style={[ui.muted, s.sub]}>
            {v.account} · {signedBy ? `signed by ${signedBy}` : 'not signed'}
            {'\n'}
            {money(total)} in charges · {plural(v.photoKinds.length, 'photo')}
          </Text>
        </View>
        {next ? (
          <>
            <SectionLabel>Up next</SectionLabel>
            <VisitCard
              visit={next}
              showStatus={false}
              onPress={() =>
                navigation.reset({ index: 1, routes: [{ name: 'MyDay' }, { name: 'Visit', params: { visitId: next.id } }] })
              }
            />
          </>
        ) : (
          <Card style={{ alignItems: 'center' }}>
            <Text style={{ fontWeight: '700', color: colors.text }}>That was your last visit today.</Text>
          </Card>
        )}
      </ScrollView>
      <Footer>
        <Button variant="dark" label="Back to my day" onPress={() => navigation.popToTop()} />
      </Footer>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, paddingTop: 28, paddingHorizontal: 8, paddingBottom: 8 },
  badge: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 16, lineHeight: 22, textAlign: 'center' },
});
