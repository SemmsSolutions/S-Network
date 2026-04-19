# Flutter Crash — Root Cause Diagnosis
## The splash shows = Flutter starts. Then closes = Dart code crashes before runApp.

---

## DO THIS FIRST — GET THE EXACT CRASH LINE (2 minutes)

Connect phone to PC via USB. Run this command on PC while tapping the app icon:

```bash
adb logcat --clear && adb logcat | grep -E "FATAL|flutter|Exception|Error|Crash" 
```

The crash reason will appear within 3 seconds of tapping the app.
Copy the lines that start with `E/` or `F/` and share them.

If you don't have adb: enable Developer Options on Samsung → enable USB Debugging → run command above.

---

## MEANWHILE — Apply this targeted fix (most likely cause)

The crash is in Dart code, not the build. Since it worked before and broke after code changes,
the problem is almost certainly one of these 3 things:

### LIKELY CAUSE 1: routerProvider throws on init

In router.dart, the `routerProvider` is a Riverpod provider. If it references
another provider that fails (like profileProvider or authStateProvider), it
throws before runApp completes.

**Fix** — in router.dart, wrap the router creation defensively:

```dart
final routerProvider = Provider<GoRouter>((ref) {
  // Don't watch any async providers here — they cause crashes
  // Use a simple redirect function instead
  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: false,
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(children: [
          const Text('Page not found'),
          ElevatedButton(
            onPressed: () => context.go('/'),
            child: const Text('Go Home'),
          )
        ]),
      ),
    ),
    redirect: (context, state) async {
      try {
        final session = Supabase.instance.client.auth.currentSession;
        final protectedRoutes = ['/vendor', '/admin', '/profile', '/saved'];
        final isProtected = protectedRoutes.any((r) => state.matchedLocation.startsWith(r));
        if (isProtected && session == null) return '/auth/login';
        return null;
      } catch (e) {
        return null; // Never crash on redirect
      }
    },
    routes: [
      // your routes here
    ],
  );
});
```

### LIKELY CAUSE 2: Google Fonts fails (most common after adding Syne font)

If you added `GoogleFonts.syne()` or `GoogleFonts.dmSans()` in `app_theme.dart`
and the font can't be fetched, it can crash in release mode.

**Fix** — in app_theme.dart, replace GoogleFonts with bundled fallback:

```dart
import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get theme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFFE85D26),
    ),
    // DO NOT use GoogleFonts here — causes release crashes
    // Use system font with custom weight instead:
    textTheme: const TextTheme(
      headlineLarge: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5),
      headlineMedium: TextStyle(fontWeight: FontWeight.w700),
      titleLarge: TextStyle(fontWeight: FontWeight.w700),
      bodyLarge: TextStyle(fontWeight: FontWeight.w400),
      bodyMedium: TextStyle(fontWeight: FontWeight.w400),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF1A1A2E),
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFE85D26),
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.grey.shade50,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE85D26), width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red),
      ),
    ),
    cardTheme: CardTheme(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: Colors.white,
    ),
  );
}
```

### LIKELY CAUSE 3: Riverpod provider initialized at top-level

If any Riverpod providers are defined with `ref.watch()` or `ref.read()` 
called at TOP LEVEL (outside a widget), it crashes immediately.

Search for any provider that looks like this and remove/fix it:

```dart
// WRONG — crashes on startup
final someData = someProvider.notifier; // top-level access

// RIGHT — only inside widgets or other providers
final someDataProvider = FutureProvider((ref) async {
  // safe
});
```

---

## main.dart — FINAL VERSION (paste this exactly)

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Import your router
import 'router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  // Initialize Supabase — hardcoded keys (no env variables needed)
  await Supabase.initialize(
    url: 'https://exqvpzijavrbpfzqixnk.supabase.co',
    anonKey: 'PASTE_YOUR_ANON_KEY_HERE',
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
      autoRefreshToken: true,
    ),
    debug: false,
  );

  runApp(const ProviderScope(child: SNetworkApp()));
}

class SNetworkApp extends ConsumerWidget {
  const SNetworkApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch router — if this crashes, we'll see it in logcat
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'S-Network',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFE85D26)),
        useMaterial3: true,
      ),
      routerConfig: router,
    );
  }
}
```

**Replace `PASTE_YOUR_ANON_KEY_HERE`** with your real anon key from:
Supabase Dashboard → Project Settings → API → anon public key

---

## STEPS TO FIX AND REBUILD

```bash
# 1. Apply the fixes above to main.dart and app_theme.dart

# 2. Remove google_fonts from pubspec.yaml if it's there
#    (comment it out temporarily to test)

# 3. Clean and rebuild
flutter clean
flutter pub get
flutter build apk --release --no-shrink

# 4. Install
adb install -r build/app/outputs/flutter-apk/app-release.apk
# OR transfer file to phone manually

# 5. While opening app, run:
adb logcat | grep flutter
```

---

## IF STILL CRASHING — Nuclear Option (proves it's code not build)

Create a brand new minimal main.dart with ONLY this:

```dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: 'https://exqvpzijavrbpfzqixnk.supabase.co',
    anonKey: 'YOUR_ANON_KEY',
  );
  runApp(const ProviderScope(child: MaterialApp(
    home: Scaffold(body: Center(child: Text('S-Network Works!'))),
  )));
}
```

Build and install this. If THIS opens on phone → the crash is in your router/theme/providers.
If THIS also crashes → the crash is in Supabase init or a native plugin.

This tells us exactly which layer to fix.
