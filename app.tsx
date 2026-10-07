/**
 * ServiceBird field worker app.
 *
 * Login is handled by the Salesforce Mobile SDK: the worker signs in on the
 * normal Salesforce login page and the app only ever talks to their own org.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorView, Loading } from './src/components/ui';
import type { RootStackParamList } from './src/navigation';
import { AddChargeScreen } from './src/screens/AddChargeScreen';
import { CompleteScreen } from './src/screens/CompleteScreen';
import { DoneScreen } from './src/screens/DoneScreen';
import { MyDayScreen } from './src/screens/MyDayScreen';
import { PhotosScreen } from './src/screens/PhotosScreen';
import { VisitScreen } from './src/screens/VisitScreen';
import { SessionProvider } from './src/session';
import { errorMessage, getSession, logout, Session } from './src/sf/api';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(() => {
    setError(null);
    // The native side needs a moment before the login bridge is ready (same as the SDK template).
    setTimeout(() => {
      getSession()
        .then(setSession)
        .catch(e => setError('Could not log in to Salesforce. ' + errorMessage(e)));
    }, 500);
  }, []);

  useEffect(login, [login]);

  const value = useMemo(
    () =>
      session && {
        ...session,
        signOut: () => {
          logout().finally(() => {
            setSession(null);
            login();
          });
        },
      },
    [session, login],
  );

  if (!value) {
    return (
      <SafeAreaProvider>
        {error ? <ErrorView message={error} onRetry={login} /> : <Loading />}
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SessionProvider value={value}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.brand,
              headerTitleStyle: { color: colors.text, fontWeight: '700', fontSize: 18 },
              headerShadowVisible: true,
              headerBackButtonDisplayMode: 'minimal',
              statusBarStyle: 'dark',
              contentStyle: { backgroundColor: colors.background },
            }}>
            <Stack.Screen name="MyDay" component={MyDayScreen} options={{ title: 'My day' }} />
            <Stack.Screen name="Visit" component={VisitScreen} options={{ title: '' }} />
            <Stack.Screen name="AddCharge" component={AddChargeScreen} options={{ title: 'Add charge' }} />
            <Stack.Screen name="Photos" component={PhotosScreen} options={{ title: 'Photos' }} />
            <Stack.Screen name="Complete" component={CompleteScreen} options={{ title: 'Complete visit' }} />
            <Stack.Screen
              name="Done"
              component={DoneScreen}
              options={{ title: 'Visit completed', headerBackVisible: false, gestureEnabled: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

export default App;
