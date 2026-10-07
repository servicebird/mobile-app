import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { Asset, ImagePickerResponse, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Icon } from '../components/Icon';
import { Button, Field, Footer, LinkButton, Segmented, styles as ui } from '../components/ui';
import type { ScreenProps } from '../navigation';
import { errorMessage } from '../sf/api';
import { PhotoKind, uploadPhoto } from '../sf/serviceBird';
import { colors, radius } from '../theme';

const KINDS: readonly PhotoKind[] = ['Before', 'After', 'Other'];

// Keep uploads small: technicians are often on weak mobile data.
const PICKER = { mediaType: 'photo', includeBase64: true, maxWidth: 1600, maxHeight: 1600, quality: 0.7 } as const;

interface Shot {
  uri: string;
  kind: PhotoKind;
  state: 'uploading' | 'done' | 'failed';
}

export function PhotosScreen({ navigation, route }: ScreenProps<'Photos'>) {
  const { jobId, jobNumber } = route.params;
  const [kind, setKind] = useState<PhotoKind>('After');
  const [shots, setShots] = useState<Shot[]>([]);

  const upload = async (asset: Asset, k: PhotoKind) => {
    if (!asset.base64 || !asset.uri) {
      return;
    }
    const uri = asset.uri;
    const mark = (state: Shot['state']) => setShots(s => s.map(x => (x.uri === uri ? { ...x, state } : x)));
    setShots(s => [{ uri, kind: k, state: 'uploading' }, ...s]);
    try {
      await uploadPhoto(jobId, jobNumber, k, asset.base64);
      mark('done');
    } catch (e) {
      mark('failed');
      Alert.alert('Photo not uploaded', errorMessage(e));
    }
  };

  const handle = (res: ImagePickerResponse) => {
    if (res.errorCode) {
      Alert.alert('Camera not available', res.errorMessage ?? res.errorCode);
      return;
    }
    res.assets?.forEach(a => upload(a, kind));
  };

  const uploading = shots.some(s => s.state === 'uploading');

  return (
    <View style={ui.screen}>
      <ScrollView contentContainerStyle={[ui.scroll, { gap: 18 }]}>
        <Field label="Tag new photos as">
          <Segmented options={KINDS} value={kind} onChange={setKind} />
        </Field>
        <View style={ui.thumbs}>
          <Pressable accessibilityRole="button" onPress={() => launchCamera(PICKER, handle)} style={s.add}>
            <Icon name="camera" size={28} color={colors.navy} strokeWidth={1.8} />
            <Text style={s.addText}>Take photo</Text>
          </Pressable>
          {shots.map(shot => (
            <View key={shot.uri} style={ui.thumb}>
              <Image source={{ uri: shot.uri }} style={StyleSheet.absoluteFill} />
              {shot.state !== 'done' && (
                <View style={s.overlay}>
                  <Text style={s.overlayText}>{shot.state === 'uploading' ? 'Uploading…' : 'Failed'}</Text>
                </View>
              )}
              <Text style={ui.thumbTag}>{shot.kind}</Text>
            </View>
          ))}
        </View>
        <LinkButton label="Choose from gallery" onPress={() => launchImageLibrary({ ...PICKER, selectionLimit: 0 }, handle)} />
        <Text style={[ui.muted, { fontSize: 14, lineHeight: 20 }]}>Photos upload straight to the job's Files.</Text>
      </ScrollView>
      <Footer>
        <Button variant="dark" label={uploading ? 'Uploading…' : 'Done'} disabled={uploading} onPress={() => navigation.goBack()} />
      </Footer>
    </View>
  );
}

const s = StyleSheet.create({
  add: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: radius.small,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addText: { fontSize: 14, fontWeight: '700', color: colors.navy },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  overlayText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
