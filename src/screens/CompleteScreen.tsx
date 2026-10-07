import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SignaturePad, SignaturePadHandle } from '../components/SignaturePad';
import { Button, Card, ErrorView, Field, Footer, Input, LinkButton, Loading, SectionLabel, styles as ui } from '../components/ui';
import { money, plural } from '../format';
import type { ScreenProps } from '../navigation';
import { errorMessage } from '../sf/api';
import { completeVisit, getVisitDetail } from '../sf/serviceBird';
import { colors } from '../theme';
import { useLoad } from '../useLoad';

export function CompleteScreen({ navigation, route }: ScreenProps<'Complete'>) {
  const { visitId } = route.params;
  const load = useCallback(() => getVisitDetail(visitId), [visitId]);
  const { data: v, error, reload } = useLoad(load);

  const pad = useRef<SignaturePadHandle>(null);
  const [sigEmpty, setSigEmpty] = useState(true);
  const [note, setNote] = useState('');
  const [signer, setSigner] = useState('');
  const [saving, setSaving] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  useEffect(() => {
    if (v && signer === '') {
      setSigner(v.contactName);
    }
  }, [v, signer]);

  const onSigChange = useCallback((empty: boolean) => setSigEmpty(empty), []);

  if (error) {
    return <ErrorView message={error} onRetry={reload} />;
  }
  if (!v) {
    return <Loading />;
  }

  const total = v.charges.reduce((sum, c) => sum + c.amount, 0);

  const finish = async (withSignature: boolean) => {
    setSaving(true);
    try {
      const signaturePng = withSignature ? await pad.current!.toPng() : null;
      const signedBy = withSignature ? signer.trim() : '';
      await completeVisit({ visit: v, note, signedBy, signaturePng });
      navigation.replace('Done', { visitId: v.id, signedBy: withSignature ? signedBy : null });
    } catch (e) {
      Alert.alert('Could not complete the visit', errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={[ui.scroll, { gap: 14 }]} scrollEnabled={scrollEnabled} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 8 }}>
          <SectionLabel>Summary</SectionLabel>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{v.account}</Text>
          <Text style={[ui.muted, { fontSize: 15 }]}>
            {v.title} · {plural(v.photoKinds.length, 'photo')}
          </Text>
          <View style={[ui.total, { marginTop: 4 }]}>
            <Text style={ui.totalLabel}>Charges ({v.charges.length})</Text>
            <Text style={ui.totalValue}>{money(total)}</Text>
          </View>
        </Card>

        <Field label="Note for the office (optional)">
          <Input multiline value={note} onChangeText={setNote} placeholder="What was done, anything to follow up" />
        </Field>

        <View style={{ gap: 4 }}>
          <View style={[ui.row, { justifyContent: 'space-between' }]}>
            <Text style={{ fontSize: 13, color: colors.label }}>Customer signature</Text>
            <LinkButton label="Clear" onPress={() => pad.current?.clear()} />
          </View>
          {/* Stop the page scrolling while a finger is on the pad. */}
          <View onTouchStart={() => setScrollEnabled(false)} onTouchEnd={() => setScrollEnabled(true)} onTouchCancel={() => setScrollEnabled(true)}>
            <SignaturePad ref={pad} onChange={onSigChange} />
          </View>
          {sigEmpty && <Text style={[ui.muted, { fontSize: 14 }]}>Hand the phone to the customer to sign above.</Text>}
        </View>

        <Field label="Signed by">
          <Input value={signer} onChangeText={setSigner} autoCapitalize="words" />
        </Field>

        <LinkButton label="Customer not available to sign" onPress={() => finish(false)} />
      </ScrollView>
      <Footer>
        <Button icon="check" label="Finish visit" disabled={sigEmpty || !signer.trim()} busy={saving} onPress={() => finish(true)} />
      </Footer>
    </KeyboardAvoidingView>
  );
}
