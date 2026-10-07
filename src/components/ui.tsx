/** Small building blocks in the ServiceBird look, shared by the screens. */
import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, TextInputProps, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, touch } from '../theme';
import type { VisitStatus } from '../sf/serviceBird';
import { Icon, IconName } from './Icon';
import { Text, TextInput } from './Text';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Small uppercase heading above a card's content, e.g. CUSTOMER. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel} accessibilityRole="header">{children}</Text>;
}

type Variant = 'primary' | 'go' | 'dark' | 'ghost';

const VARIANT: Record<Variant, { bg: string; pressed: string; fg: string; border?: string }> = {
  primary: { bg: colors.amber, pressed: colors.amberDark, fg: colors.navy },
  go: { bg: colors.green, pressed: colors.greenDark, fg: '#FFFFFF' },
  dark: { bg: colors.navy, pressed: '#0D1629', fg: '#FFFFFF' },
  ghost: { bg: colors.surface, pressed: colors.soft, fg: colors.navy, border: colors.borderInput },
};

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  small?: boolean;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', icon, small, disabled, busy, style }: ButtonProps) {
  const v = VARIANT[variant];
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: pressed ? v.pressed : v.bg },
        v.border ? { borderWidth: 1.5, borderColor: pressed ? colors.navy : v.border } : null,
        small && styles.btnSmall,
        disabled && !busy && styles.btnDisabled,
        style,
      ]}>
      {busy ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={small ? 18 : 22} color={v.fg} strokeWidth={2.6} />}
          <Text style={[styles.btnText, small && styles.btnTextSmall, { color: v.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.link} hitSlop={4}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const CHIP: Record<VisitStatus, { bg: string; fg: string }> = {
  Scheduled: { bg: colors.softer, fg: colors.scheduledText },
  'On Site': { bg: colors.amber, fg: colors.navy },
  Done: { bg: colors.green, fg: '#FFFFFF' },
};

export function StatusChip({ status }: { status: VisitStatus }) {
  const c = CHIP[status] ?? CHIP.Scheduled;
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <Text style={[styles.chipText, { color: c.fg }]}>{status === 'On Site' ? 'On site' : status}</Text>
    </View>
  );
}

export function NextChip() {
  return (
    <View style={[styles.chip, { backgroundColor: colors.navy }]}>
      <Text style={[styles.chipText, { color: '#FFFFFF' }]}>Next</Text>
    </View>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

export function Input(props: TextInputProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.textWeak}
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={[styles.input, props.multiline && styles.textarea, focused && styles.inputFocus, props.style]}
    />
  );
}

/** Pill-style picker: a grey track with the chosen option raised in white. */
export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.seg} accessibilityRole="radiogroup">
      {options.map(o => {
        const on = o === value;
        return (
          <Pressable
            key={o}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o)}
            style={[styles.segBtn, on && styles.segOn]}>
            <Text style={[styles.segText, on && styles.segTextOn]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ value, onChange, step }: { value: string; onChange: (v: string) => void; step: number }) {
  const bump = (dir: 1 | -1) => {
    const next = Math.max(0, Math.round(((parseFloat(value) || 0) + dir * step) * 100) / 100);
    onChange(String(next));
  };
  return (
    <View style={styles.step}>
      <Pressable accessibilityRole="button" accessibilityLabel="Decrease quantity" onPress={() => bump(-1)} style={styles.stepBtn}>
        <Icon name="minus" size={18} color={colors.navy} strokeWidth={2.6} />
      </Pressable>
      <TextInput
        accessibilityLabel="Quantity"
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChange}
        style={styles.stepInput}
      />
      <Pressable accessibilityRole="button" accessibilityLabel="Increase quantity" onPress={() => bump(1)} style={styles.stepBtn}>
        <Icon name="plus" size={18} color={colors.navy} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}

/** Round icon button, e.g. call and directions. */
export function RoundButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.round, pressed && { backgroundColor: colors.border }]}>
      <Icon name={icon} color={colors.navy} />
    </Pressable>
  );
}

/** White bottom action bar that stays above the home indicator. */
export function Footer({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>{children}</View>;
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.navy} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && <Button label="Try again" variant="ghost" small onPress={onRetry} style={styles.retry} />}
    </View>
  );
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  sectionLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.84, textTransform: 'uppercase', color: colors.textWeak },
  btn: {
    minHeight: 54,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  btnSmall: { minHeight: touch, borderRadius: radius.small, flexGrow: 0, alignSelf: 'flex-start' },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 17, fontWeight: '800' },
  btnTextSmall: { fontSize: 15 },
  pressed: { borderColor: colors.borderStrong },
  link: { minHeight: touch, justifyContent: 'center', paddingHorizontal: 4, alignSelf: 'flex-start' },
  linkText: { fontSize: 15, fontWeight: '700', color: colors.navy, textDecorationLine: 'underline' },
  chip: { height: 26, borderRadius: 13, paddingHorizontal: 10, justifyContent: 'center', alignSelf: 'flex-start' },
  chipText: { fontSize: 13, fontWeight: '700' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '700' },
  hint: { fontSize: 14, color: colors.textWeak },
  input: {
    minHeight: 50,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 17,
  },
  textarea: { minHeight: 84, paddingTop: 12, fontSize: 16, textAlignVertical: 'top' },
  inputFocus: { borderColor: colors.navy },
  seg: { flexDirection: 'row', gap: 4, backgroundColor: colors.softer, padding: 4, borderRadius: radius.button },
  segBtn: { flex: 1, height: touch, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segOn: {
    backgroundColor: colors.surface,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  segText: { fontSize: 15, fontWeight: '600', color: colors.scheduledText },
  segTextOn: { fontWeight: '800', color: colors.navy },
  step: {
    flexDirection: 'row',
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  stepBtn: { width: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft },
  stepInput: { flex: 1, minWidth: 0, textAlign: 'center', fontSize: 18, fontWeight: '700', padding: 0 },
  round: {
    width: touch,
    height: touch,
    borderRadius: touch / 2,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background },
  errorText: { fontSize: 16, color: colors.error, textAlign: 'center' },
  retry: { marginTop: 16, alignSelf: 'center' },
  // Shared screen layout
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1, minWidth: 0 },
  muted: { color: colors.textWeak },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.soft },
  lineFirst: { borderTopWidth: 0, paddingTop: 0 },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: radius.small,
    backgroundColor: colors.softer,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbTag: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    backgroundColor: colors.navy,
    color: '#FFFFFF',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: 15 },
  totalValue: { fontSize: 22, fontWeight: '800' },
  note: { backgroundColor: colors.note, borderRadius: radius.small, padding: 12 },
  // Visit card on My day and Done
  vcard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  vtime: { width: 52, gap: 2 },
  vstart: { fontSize: 18, fontWeight: '800', letterSpacing: -0.18 },
  vend: { fontSize: 13, color: colors.textWeak },
  vaccount: { fontSize: 17, fontWeight: '700', lineHeight: 21 },
  vtitle: { fontSize: 15 },
});
