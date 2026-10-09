# ServiceBird mobile app

The field worker app for ServiceBird: React Native (TypeScript) with the
Salesforce Mobile SDK 14. One codebase builds the iPhone and the Android app.

Workers log in with their normal Salesforce username on the Salesforce login
page. The app reads and writes only that customer's org. There is no server of
our own.

## What it does today

The screens from the ServiceBird Mobile design, in the ServiceBird look
(navy, amber and green, Figtree font):

| Screen | Reads | Writes |
|---|---|---|
| Login | | opens the Salesforce login page when the worker taps Log in |
| My day | Visits where Field Worker's User = me, for the chosen day | |
| Visit | Visit, Job, Account, Contact, Job Items, Charges, photo files | Visit Status = On Site ("I'm on site") |
| Add charge | Settings rates (pre-fill) | new Charge on the Job and Visit |
| Photos | | ContentVersion on the Job, File_Kind__c = Photo, title starts with Before/After/Other |
| Complete visit | | signature PNG (File_Kind__c = Signature), Job Signed_By__c, Signed_At__c, Work_Summary__c (note appended), Visit Status = Done |
| Done | today's next Scheduled visit | |

Not yet: offline mode, a product picker for materials, maps inside the app,
push notifications.

## Where things are

```
app.tsx                    login, then the screen stack
src/sf/api.ts              Salesforce calls (query, create, update) and the NAMESPACE setting
src/sf/serviceBird.ts      every query and write, with the object and field names
src/screens/               one file per screen
src/components/            buttons, cards, chips, signature pad, icons (SLDS look)
src/theme.ts               colours and fonts from the design
assets/fonts/              Figtree font files (after adding a font: npx react-native-asset)
android/  ios/             the native projects (you rarely touch these)
```

## Setting up your computer (one time)

You need a **Mac** to build the iPhone app. Android works on Mac, Windows or Linux.

1. **Node.js 22 or newer**: https://nodejs.org (LTS installer). Then in a terminal:
   `npm install -g yarn`
2. **Android**: install **Android Studio** (https://developer.android.com/studio).
   On first start let it install the SDK, then in *Device Manager* create a
   virtual phone (for example Pixel 8, latest Android).
3. **iPhone (Mac only)**: install **Xcode** from the App Store, open it once to
   accept the licence, then in a terminal: `sudo gem install cocoapods`
   (or `brew install cocoapods` if you use Homebrew).

React Native's own guide, if anything is unclear:
https://reactnative.dev/docs/set-up-your-environment (choose "React Native CLI").

## Running the app

Copy this folder to your computer, open a terminal in it, then:

```bash
# Android
node installandroid.js     # downloads packages and the Salesforce SDK (first time only)
yarn start                 # leave this running: it serves the JavaScript
# in a second terminal:
yarn android               # builds and opens the app in the Android emulator

# iPhone (Mac)
node installios.js         # downloads packages, the Salesforce SDK and CocoaPods (first time only)
yarn start
# in a second terminal:
yarn ios                   # or open ios/ServiceBird.xcworkspace in Xcode and press Run
```

The app starts on the ServiceBird login screen. Tap **Log in** and the
Salesforce login page opens; log in with a user of an org that has the
ServiceBird objects. To test against a sandbox or a company login address, tap
the menu on the Salesforce page and choose "Use custom domain" or "Sandbox". Change your code, save, and the app reloads by itself.

## Before it shows real data

1. **The objects must exist in the org** you log in to: Job, Visit, Field
   Worker, Job Item, Charge, Settings, and File_Kind__c on ContentVersion.
   Until they do, the app shows a Salesforce error such as "sObject type
   'servicebird__Visit__c' is not supported".
2. **Namespace**: `NS` at the top of `src/sf/api.ts` is `servicebird__`.
   Set it to `''` if you test in an org where the objects were deployed without
   the namespace (for example a scratch org).
3. **Your user needs a Field Worker record** (User__c = you) and some Visits for
   today assigned to it.
4. **Settings rate field names are a guess**: `Labour_Rate__c` and
   `Travel_Rate__c` in `getRates()` in `src/sf/serviceBird.ts`. Rename them when
   the Settings custom setting is built. If they don't exist, the price is just
   left empty.

## Login settings

`android/app/src/main/res/values/bootconfig.xml` and
`ios/ServiceBird/bootconfig.plist` use the **ServiceBird Mobile** External Client
App, created in the Partner Business Org (Dev Hub) and shipped in the ServiceBird
managed package:

- Consumer key: `3MVG9si4IYYQ...` (full value in both bootconfig files)
- Callback URL: `com.servicebird.mobile://oauth/done`. The Android
  `AndroidManifest.xml` login intent filter matches it (scheme
  `com.servicebird.mobile`, host `oauth`, path `/done`).

The app can only log in to an org where ServiceBird is installed (or the Dev Hub
itself). To test against a scratch org without the package, temporarily put back
the Mobile SDK sample key
`3MVG98dostKihXN53TYStBIiS8FC2a3tE3XhGId0hQ37iQjF0xe4fxMSb2mFaWZn9e3GiLs1q67TNlyRji.Xw`
with callback `testsfdc:///mobilesdk/detect/oauth/done` (and the matching
intent filter), and don't commit it.

## Choices made in this first version

- **No username and password fields in the app.** The login screen has a Log in
  button that opens Salesforce's own login page. That way the app never handles
  passwords, MFA and single sign-on keep working, and it passes the AppExchange
  security review. Automatic login at start-up is switched off
  (`shouldAuthenticate` in `MainActivity.kt` and `bootconfig.plist`) so the
  ServiceBird screen shows first, and logging out returns to it.

- **Job title**: the Job has no title field, so the first line of the Job
  Description is shown as the title and the rest as "From the office".
- **Customer address** comes from the Account's shipping address.
- **Photo tag** (Before / After / Other) is the start of the file title, because
  File_Kind__c only has Photo / Signature / Report.
- **Office note** from the Complete screen is appended to Job.Work_Summary__c;
  **signer name** goes to Job.Signed_By__c (both already in the data model).
- **Travel** charges use the Km unit (the data model's Unit picklist), shown as "km".
- Money is shown with `$` for now.
