/**
 * ServiceBird field worker app.
 *
 * Login is handled by the Salesforce Mobile SDK: the worker taps Log in, signs
 * in on their company's Salesforce login page, and the app only ever talks to
 * that org.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Loading } from './src/components/ui';
import type { RootStackParamList } from './src/navigation';
import { AddChargeScreen } from './src/screens/AddChargeScreen';
import { CompleteScreen } from './src/screens/CompleteScreen';
import { DoneScreen } from './src/screens/DoneScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { MyDayScreen } from './src/screens/MyDayScreen';
import { PhotosScreen } from './src/screens/PhotosScreen';
import { VisitScreen } from './src/screens/VisitScreen';
import { SessionProvider } from './src/session';
import { errorMessage, getExistingSession, login, logout, Session } from './src/sf/api';
import { colors, fonts } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

type State = { kind: 'checking' } | { kind: 'loggedOut'; busy: boolean; error: string | null } | { kind: 'in'; session: Session };

function App(): React.JSX.Element {
  const [state, setState] = useState<State>({ kind: 'checking' });

  useEffect(() => {
    // The native side needs a moment before the login bridge is ready (same as the SDK template).
    const t = setTimeout(() => {
      getExistingSession().then(session =>
        setState(session ? { kind: 'in', session } : { kind: 'loggedOut', busy: false, error: null }),
      );
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const doLogin = useCallback(() => {
    setState({ kind: 'loggedOut', busy: true, error: null });
    login()
      .then(session => setState({ kind: 'in', session }))
      .catch(e => setState({ kind: 'loggedOut', busy: false, error: 'Login did not finish. ' + errorMessage(e) }));
  }, []);

  const value = useMemo(
    () =>
      state.kind === 'in' && {
        ...state.session,
        signOut: () => {
          logout().finally(() => setState({ kind: 'loggedOut', busy: false, error: null }));
        },
      },
    [state],
  );

  return (
    <SafeAreaProvider>
      {state.kind === 'checking' && <Loading />}
      {state.kind === 'loggedOut' && <LoginScreen onLogin={doLogin} busy={state.busy} error={state.error} />}
      {value && (
        <SessionProvider value={value}>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: colors.navy },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 19 },
                headerShadowVisible: false,
                headerBackButtonDisplayMode: 'minimal',
                statusBarStyle: 'light',
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
      )}
    </SafeAreaProvider>
  );
}

export default App;
