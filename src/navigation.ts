import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  MyDay: undefined;
  Visit: { visitId: string };
  AddCharge: { visitId: string; jobId: string };
  Photos: { jobId: string; jobNumber: string };
  Complete: { visitId: string };
  Done: { visitId: string; signedBy: string | null };
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
