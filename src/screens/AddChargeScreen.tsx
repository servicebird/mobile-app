import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Text } from '../components/Text';
import { Button, Card, Field, Footer, Input, Segmented, Stepper, styles as ui } from '../components/ui';
import { money, unitLabel } from '../format';
import type { ScreenProps } from '../navigation';
import { useSession } from '../session';
import { errorMessage } from '../sf/api';
import { addCharge, ChargeType, getRates, Rates, UNIT_FOR_TYPE } from '../sf/serviceBird';

const TYPES: readonly ChargeType[] = ['Labour', 'Material', 'Travel', 'Other'];

interface Form {
  type: ChargeType;
  desc: string;
  qty: string;
  price: string;
}

function blankForm(type: ChargeType, rates: Rates): Form {
  const rate = (n: number | null) => (n == null ? '' : n.toFixed(2));
  switch (type) {
    case 'Labour':
      return { type, desc: 'Labour', qty: '1', price: rate(rates.labour) };
    case 'Travel':
      return { type, desc: 'Travel', qty: '1', price: rate(rates.travel) };
    default:
      return { type, desc: '', qty: '1', price: '' };
  }
}

export function AddChargeScreen({ navigation, route }: ScreenProps<'AddCharge'>) {
  const { visitId, jobId } = route.params;
  const session = useSession();
  const [rates, setRates] = useState<Rates>({ labour: null, travel: null });
  const [form, setForm] = useState<Form>(() => blankForm('Labour', rates));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getRates(session.orgId).then(r => {
      setRates(r);
      // Only pre-fill if the worker has not typed a price yet.
      setForm(f => (f.price === '' ? blankForm(f.type, r) : f));
    });
  }, [session.orgId]);

  const qty = parseFloat(form.qty.replace(',', '.'));
  const price = parseFloat(form.price.replace(',', '.'));
  const valid = qty > 0 && price >= 0 && form.desc.trim() !== '';
  const unit = unitLabel[UNIT_FOR_TYPE[form.type]];
  const isMaterial = form.type === 'Material';
  const rateHint =
    form.type === 'Labour' ? 'Hourly rate comes from ServiceBird settings.'
      : form.type === 'Travel' ? 'Rate per km comes from ServiceBird settings.' : undefined;

  const save = async () => {
    setSaving(true);
    try {
      await addCharge({ jobId, visitId, type: form.type, description: form.desc.trim(), quantity: qty, unitPrice: price });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save the charge', errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={[ui.scroll, { gap: 18 }]} keyboardShouldPersistTaps="handled">
        <Field label="Type">
          <Segmented options={TYPES} value={form.type} onChange={t => setForm(blankForm(t, rates))} />
        </Field>
        <Field label={isMaterial ? 'Product' : 'Description'} hint={isMaterial ? 'Type the product name.' : undefined}>
          <Input
            value={form.desc}
            onChangeText={desc => setForm({ ...form, desc })}
            placeholder={isMaterial ? 'e.g. Radiator valve 15mm' : 'What is this for?'}
          />
        </Field>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label={`Quantity${unit ? ` (${unit})` : ''}`}>
              <Stepper value={form.qty} onChange={q => setForm({ ...form, qty: q })} step={form.type === 'Labour' ? 0.25 : 1} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Unit price ($)">
              <Input
                keyboardType="decimal-pad"
                value={form.price}
                onChangeText={p => setForm({ ...form, price: p })}
                placeholder="0.00"
              />
            </Field>
          </View>
        </View>
        {rateHint && <Text style={[ui.muted, { fontSize: 14, marginTop: -8 }]}>{rateHint}</Text>}
        <Card style={[ui.total, { flexDirection: 'row' }]}>
          <Text style={ui.totalLabel}>Total</Text>
          <Text style={ui.totalValue}>{money(valid ? qty * price : 0)}</Text>
        </Card>
      </ScrollView>
      <Footer>
        <Button label="Save charge" disabled={!valid} busy={saving} onPress={save} />
      </Footer>
    </KeyboardAvoidingView>
  );
}
