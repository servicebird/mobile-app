/**
 * First screen when nobody is logged in. "Log in" opens the Salesforce login
 * page of the worker's company; the app itself never sees the password.
 */
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BirdMark, Wordmark } from '../components/Logo';
import { Text } from '../components/Text';
import { Button } from '../components/ui';
import { colors } from '../theme';

interface Props {
  onLogin: () => void;
  busy: boolean;
  error: string | null;
}

export function LoginScreen({ onLogin, busy, error }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      <View style={[s.brand, { paddingTop: insets.top + 24 }]}>
        <BirdMark size={104} tile />
        <Wordmark size={36} />
        <Text style={s.tagline}>Your jobs for today, in your pocket.</Text>
      </View>
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Text style={s.title}>Log in</Text>
        <Text style={s.body}>Use the username and password you use for Salesforce at work.</Text>
        {!!error && <Text style={s.error}>{error}</Text>}
        <Button label="Log in" busy={busy} onPress={onLogin} style={s.button} />
        <Text style={s.hint}>
          Does your company log in at its own address, like acme.my.salesforce.com? Choose "Use custom domain" on the
          next screen.
        </Text>
        <Text style={s.footer}>Signs in with your company's Salesforce account.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  brand: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24 },
  tagline: { color: colors.textOnNavy, fontSize: 16 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 28,
    paddingHorizontal: 24,
    gap: 16,
  },
  title: { fontSize: 22, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 22, color: colors.textWeak },
  error: { fontSize: 15, color: colors.error },
  button: { flexGrow: 0, marginTop: 4 },
  hint: { fontSize: 14, lineHeight: 20, color: colors.textWeak },
  footer: { marginTop: 8, textAlign: 'center', fontSize: 13, color: colors.textWeak },
});
