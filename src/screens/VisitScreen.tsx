import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Button, Card, ErrorView, Footer, Loading, SectionLabel, StatusChip, styles as ui } from '../components/ui';
import { money, plural, time, unitLabel } from '../format';
import type { ScreenProps } from '../navigation';
import { errorMessage } from '../sf/api';
import { getVisitDetail, setVisitStatus } from '../sf/serviceBird';
import { colors } from '../theme';
import { useLoad } from '../useLoad';

export function mapsUrl(address: string): string {
  const q = encodeURIComponent(address);
  return Platform.OS === 'ios' ? `http://maps.apple.com/?daddr=${q}` : `geo:0,0?q=${q}`;
}

export function VisitScreen({ navigation, route }: ScreenProps<'Visit'>) {
  const { visitId } = route.params;
  const load = useCallback(() => getVisitDetail(visitId), [visitId]);
  const { data: v, error, refreshing, refresh, reload } = useLoad(load);
  const [arriving, setArriving] = useState(false);

  useLayoutEffect(() => {
    if (v) {
      navigation.setOptions({ title: v.account });
    }
  }, [navigation, v]);

  if (error) {
    return <ErrorView message={error} onRetry={reload} />;
  }
  if (!v) {
    return <Loading />;
  }

  const total = v.charges.reduce((sum, c) => sum + c.amount, 0);
  const editable = v.status !== 'Done';

  const arrive = async () => {
    setArriving(true);
    try {
      await setVisitStatus(v.id, 'On Site');
      await reload();
    } catch (e) {
      Alert.alert('Could not update the visit', errorMessage(e));
    } finally {
      setArriving(false);
    }
  };

  return (
    <View style={ui.screen}>
      <ScrollView
        contentContainerStyle={ui.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}>
        <Card>
          <View style={[ui.row, { justifyContent: 'space-between' }]}>
            <StatusChip status={v.status} />
            <Text style={[ui.muted, { fontSize: 14, fontWeight: '600' }]}>
              {v.jobNumber}{v.jobType ? ` · ${v.jobType}` : ''}
            </Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', lineHeight: 26, color: colors.text }}>{v.title}</Text>
          <View style={[ui.row, { gap: 8 }]}>
            <Icon name="clock" size={18} color={colors.text} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
              {time(v.start)} – {time(v.end)}
            </Text>
          </View>
        </Card>

        <Card>
          <SectionLabel>Customer</SectionLabel>
          <View style={ui.row}>
            <View style={ui.grow}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{v.account}</Text>
              <Text style={[ui.muted, { fontSize: 15 }]}>
                {[v.contactName, v.phone].filter(Boolean).join(' · ')}
              </Text>
            </View>
            {!!v.phone && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Call contact"
                onPress={() => Linking.openURL('tel:' + v.phone.replace(/[^\d+]/g, ''))}
                style={ui.squareBtn}>
                <Icon name="phone" color={colors.brand} />
              </Pressable>
            )}
          </View>
          {!!v.address && (
            <View style={ui.row}>
              <Text style={[ui.grow, { fontSize: 15, color: colors.text }]}>{v.address}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open directions in maps"
                onPress={() => Linking.openURL(mapsUrl(v.address))}
                style={ui.squareBtn}>
                <Icon name="navigate" color={colors.brand} />
              </Pressable>
            </View>
          )}
        </Card>

        <Card>
          <SectionLabel>Work to do</SectionLabel>
          <View>
            {v.items.map((it, i) => (
              <View key={it.id} style={[ui.line, i === 0 && ui.lineFirst]}>
                <Icon name="check" color={colors.success} strokeWidth={2.4} />
                <Text style={[ui.grow, { fontSize: 16, color: colors.text }]}>{it.name}</Text>
                <Text style={[ui.muted, { fontSize: 15, fontWeight: '700' }]}>×{it.quantity}</Text>
              </View>
            ))}
            {v.items.length === 0 && <Text style={[ui.muted, { fontSize: 15 }]}>No planned items.</Text>}
          </View>
          {!!v.officeNotes && (
            <View style={{ backgroundColor: colors.background, borderRadius: 4, padding: 12 }}>
              <Text style={{ fontSize: 15, lineHeight: 21, color: colors.text }}>
                <Text style={{ fontWeight: '700' }}>From the office: </Text>
                {v.officeNotes}
              </Text>
            </View>
          )}
        </Card>

        <Card>
          <View style={[ui.row, { justifyContent: 'space-between' }]}>
            <SectionLabel>Charges</SectionLabel>
            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>{money(total)}</Text>
          </View>
          <View>
            {v.charges.map((c, i) => (
              <View key={c.id} style={[ui.line, i === 0 && ui.lineFirst]}>
                <View style={ui.grow}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{c.description || c.type}</Text>
                  <Text style={[ui.muted, { fontSize: 14 }]}>
                    {c.type} · {c.quantity}{unitLabel[c.unit] ? ' ' + unitLabel[c.unit] : ''} × {money(c.unitPrice)}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{money(c.amount)}</Text>
              </View>
            ))}
            {v.charges.length === 0 && <Text style={[ui.muted, { fontSize: 15 }]}>No charges yet.</Text>}
          </View>
          {editable && (
            <Button
              small
              variant="neutral"
              icon="plus"
              label="Add charge"
              onPress={() => navigation.navigate('AddCharge', { visitId: v.id, jobId: v.jobId })}
            />
          )}
        </Card>

        <Card>
          <View style={[ui.row, { justifyContent: 'space-between' }]}>
            <SectionLabel>Photos</SectionLabel>
            <Text style={[ui.muted, { fontWeight: '700', fontSize: 15 }]}>{plural(v.photoKinds.length, 'photo')}</Text>
          </View>
          {v.photoKinds.length > 0 && (
            <View style={ui.thumbs}>
              {v.photoKinds.slice(-3).map((kind, i) => (
                <View key={i} style={ui.thumb}>
                  <Icon name="camera" size={22} color={colors.textWeak} strokeWidth={1.8} />
                  <Text style={ui.thumbTag}>{kind}</Text>
                </View>
              ))}
            </View>
          )}
          {editable && (
            <Button
              small
              variant="neutral"
              icon="camera"
              label="Add photos"
              onPress={() => navigation.navigate('Photos', { jobId: v.jobId, jobNumber: v.jobNumber })}
            />
          )}
        </Card>
      </ScrollView>

      <Footer>
        {v.status === 'Scheduled' && (
          <>
            <Button
              variant="neutral"
              icon="navigate"
              label="Go"
              style={{ flexGrow: 0 }}
              onPress={() => Linking.openURL(mapsUrl(v.address))}
            />
            <Button label="I'm on site" busy={arriving} onPress={arrive} />
          </>
        )}
        {v.status === 'On Site' && (
          <Button icon="check" label="Complete visit" onPress={() => navigation.navigate('Complete', { visitId: v.id })} />
        )}
        {v.status === 'Done' && (
          <View style={[ui.row, { flex: 1, justifyContent: 'center', height: 44, gap: 8 }]}>
            <Icon name="check" size={22} color={colors.success} strokeWidth={2.6} />
            <Text style={{ fontWeight: '700', color: colors.success, fontSize: 16 }}>Visit completed</Text>
          </View>
        )}
      </Footer>
    </View>
  );
}
