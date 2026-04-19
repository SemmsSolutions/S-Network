# S-Network Flutter — CRASH FIX PROMPT
## App closes immediately on open (Samsung device)
## Run this with Opus after the APK rebuild attempt

---

```
The Flutter release APK crashes silently the moment it opens on Android.
R8 minification has been disabled and an error boundary added by a previous fix.
Now rebuild and diagnose properly. Work through every step.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — REBUILD AND READ THE CRASH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1a. Build the release APK:
    cd build-connect-mobile
    flutter clean
    flutter pub get
    flutter build apk --release --no-shrink

    If build fails: read the error output completely and fix it before continuing.
    Common build errors to fix:
    - "minifyEnabled is not a property" → use isMinifyEnabled in build.gradle.kts
    - "shrinkResources is not a property" → use isShrinkResources
    - Kotlin version incompatibility → update kotlin_version in build.gradle

1b. Install on Android device:
    adb install -r build/app/outputs/flutter-apk/app-release.apk
    OR transfer APK manually and install

1c. Read the crash log while the app is open on device:
    adb logcat | grep -E "flutter|FATAL|AndroidRuntime|Error"
    
    Run this command on PC while opening the app on phone.
    The crash reason will appear in this output.
    Report the exact error text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — FIX main.dart INITIALIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace the entire lib/main.dart with this safe version:

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'router.dart';
import 'shared/theme/app_theme.dart';

void main() async {
  // Catch ALL errors globally
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('FLUTTER ERROR: ${details.exception}');
    debugPrint('STACK: ${details.stack}');
  };

  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  try {
    await Supabase.initialize(
      url: const String.fromEnvironment(
        'SUPABASE_URL',
        defaultValue: 'https://exqvpzijavrbpfzqixnk.supabase.co',
      ),
      anonKey: const String.fromEnvironment(
        'SUPABASE_ANON_KEY',
        defaultValue: 'YOUR_ANON_KEY_HERE',  // REPLACE WITH REAL KEY
      ),
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
        autoRefreshToken: true,
      ),
      debug: false,
    );
  } catch (e, stack) {
    debugPrint('SUPABASE INIT ERROR: $e');
    debugPrint('STACK: $stack');
    runApp(ErrorApp(message: 'Init error: $e'));
    return;
  }

  runApp(const ProviderScope(child: SNetworkApp()));
}

class SNetworkApp extends ConsumerWidget {
  const SNetworkApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'S-Network',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      routerConfig: router,
    );
  }
}

class ErrorApp extends StatelessWidget {
  final String message;
  const ErrorApp({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: Color(0xFFE85D26), size: 64),
                const SizedBox(height: 16),
                const Text('S-Network', style: TextStyle(
                  fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF1A1A2E)
                )),
                const SizedBox(height: 8),
                const Text('Startup Error', style: TextStyle(
                  fontSize: 16, color: Color(0xFFE85D26)
                )),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Text(message,
                    style: const TextStyle(fontSize: 12, color: Colors.red),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

IMPORTANT: Replace 'YOUR_ANON_KEY_HERE' with your actual Supabase anon key.
Get it from: Supabase Dashboard → Settings → API → anon/public key

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — FIX android/app/build.gradle.kts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace the release buildTypes block with:

```kotlin
buildTypes {
    release {
        // R8 DISABLED — prevents stripping required plugin code
        isMinifyEnabled = false
        isShrinkResources = false
        signingConfig = signingConfigs.getByName("debug")
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
    }
    debug {
        isDebuggable = true
    }
}
```

Note: using debug signingConfig for now to avoid keystore issues.
This is fine for testing — use your release keystore when publishing to Play Store.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — FIX proguard-rules.pro
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In android/app/proguard-rules.pro, add ALL of these rules:

# Flutter
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Supabase + Kotlin serialization
-keep class io.github.jan.supabase.** { *; }
-keepclassmembers class * {
    @kotlinx.serialization.SerialName <fields>;
}
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

# Google fonts
-keep class com.google.fonts.** { *; }

# File picker
-keep class com.mr.flutter.plugin.filepicker.** { *; }

# Shared preferences
-keep class io.flutter.plugins.sharedpreferences.** { *; }

# Geolocator
-keep class com.baseflow.geolocator.** { *; }

# Connectivity
-keep class dev.fluttercommunity.plus.connectivity.** { *; }

# Local notifications
-keep class com.dexterous.flutterlocalnotifications.** { *; }

# Keep all model classes
-keep class **.models.** { *; }
-keep class **.data.** { *; }

# Prevent stripping of Dart runtime reflection
-keepattributes Signature
-keepattributes SourceFile,LineNumberTable

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — FIX pubspec.yaml (plugin compatibility)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check pubspec.yaml for version conflicts. Update these if needed:

dependencies:
  flutter:
    sdk: flutter
  supabase_flutter: ^2.3.0
  flutter_riverpod: ^2.4.9
  riverpod: ^2.4.9
  go_router: ^13.2.0
  cached_network_image: ^3.3.1
  shared_preferences: ^2.2.2
  geolocator: ^11.0.0
  flutter_local_notifications: ^17.0.0
  image_picker: ^1.0.7
  file_picker: ^8.0.0
  url_launcher: ^6.2.5
  connectivity_plus: ^6.0.3
  intl: ^0.19.0

After updating: flutter pub get
Check for any "version conflict" errors and resolve them.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — FIX AndroidManifest.xml
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In android/app/src/main/AndroidManifest.xml, ensure these exist:

<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="32"/>
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

    <application
        android:label="S-Network"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:usesCleartextTraffic="false"
        android:networkSecurityConfig="@xml/network_security_config">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:taskAffinity=""
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">

            <meta-data
                android:name="io.flutter.embedding.android.NormalTheme"
                android:resource="@style/NormalTheme"/>

            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>

            <!-- Deep link for OAuth -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                <data android:scheme="io.snetwork.app"/>
            </intent-filter>
        </activity>

        <!-- Local notifications -->
        <receiver android:exported="false"
            android:name="com.dexterous.flutterlocalnotifications.ScheduledNotificationReceiver"/>
        <receiver android:exported="false"
            android:name="com.dexterous.flutterlocalnotifications.ScheduledNotificationBootReceiver">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED"/>
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED"/>
            </intent-filter>
        </receiver>
    </application>
</manifest>

Also create android/app/src/main/res/xml/network_security_config.xml:
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">supabase.co</domain>
    </domain-config>
</network-security-config>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 7 — FIX android/build.gradle.kts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In android/build.gradle.kts (root level), ensure Kotlin version is 1.9+:

plugins {
    id("com.android.application") version "8.1.0" apply false
    id("com.android.library") version "8.1.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.10" apply false
}

In android/app/build.gradle.kts, ensure:
  android {
    compileSdk = 34
    defaultConfig {
      applicationId = "com.snetwork.app"
      minSdk = 21
      targetSdk = 34
      versionCode = 1
      versionName = "1.0.0"
      multiDexEnabled = true
    }
  }

  dependencies {
    implementation("androidx.multidex:multidex:2.0.1")
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 8 — REBUILD AND TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run in order:
  flutter clean
  flutter pub get
  flutter build apk --release --no-shrink

If build succeeds:
  adb install -r build/app/outputs/flutter-apk/app-release.apk

Open app on phone. Three outcomes:

OUTCOME A — App opens normally:
  ✅ Fixed. R8 was stripping required code.
  Continue with app testing.

OUTCOME B — App shows red error screen (from ErrorApp):
  Read the error text on screen.
  Report it — the exact message tells us what's crashing.

OUTCOME C — App still closes silently:
  Run: adb logcat -s flutter
  Open app. Read the logcat output.
  The crash reason will appear there.
  Report the exact logcat lines starting with E/ or F/.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 9 — IF SUPABASE KEY IS MISSING (most common cause)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If the error is about Supabase URL being empty or invalid,
the app was built without the environment variables.

Fix: in main.dart, hardcode the values directly for now:

  await Supabase.initialize(
    url: 'https://exqvpzijavrbpfzqixnk.supabase.co',
    anonKey: 'YOUR_ACTUAL_ANON_KEY',  // get from Supabase Dashboard → Settings → API
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );

Get your anon key from:
  Supabase Dashboard → Project Settings → API → Project API keys → anon/public

Then rebuild: flutter build apk --release --no-shrink

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 10 — QUICK DEBUG APK (if release still fails)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build a DEBUG apk to confirm the app logic works:
  flutter build apk --debug

Install it. If debug works but release doesn't:
  → The problem is 100% R8/minification (already disabled, should be fixed)
  → Double-check build.gradle.kts has isMinifyEnabled = false

If debug also crashes:
  → The problem is in the app code, not the build
  → Run: flutter run (with phone connected via USB)
  → Read the console output as it crashes
```
