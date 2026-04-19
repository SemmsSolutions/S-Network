import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  try {
    await Supabase.initialize(
      url: 'https://exqvpzijavrbpfzqixnk.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cXZwemlqYXZyYnBmenFpeG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTE5NzAsImV4cCI6MjA5MTU2Nzk3MH0.LQ1aZwesA5q7njMZ__zSSpaOmXV06TrAisVcP2PQ_9I',
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
        autoRefreshToken: true,
      ),
      debug: false,
    );
  } catch (e) {
    debugPrint('Supabase Init Error: $e');
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
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFE85D26)),
        useMaterial3: true,
      ),
      routerConfig: router,
    );
  }
}
