import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;

final authServiceProvider = NotifierProvider<AuthService, AppAuthState>(() {
  return AuthService();
});

class AppAuthState {
  final User? user;
  final String? role;
  final bool isLoading;

  AppAuthState({this.user, this.role, this.isLoading = true});

  AppAuthState copyWith({User? user, String? role, bool? isLoading}) {
    return AppAuthState(
      user: user ?? this.user,
      role: role ?? this.role,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class AuthService extends Notifier<AppAuthState> {
  final _supabase = Supabase.instance.client;
  StreamSubscription? _authSubscription;

  @override
  AppAuthState build() {
    _init();
    return AppAuthState(isLoading: true);
  }

  void _init() {
    _authSubscription = _supabase.auth.onAuthStateChange.listen((data) async {
      final session = data.session;
      if (session != null) {
        // Fetch role with retry to avoid race condition with trigger
        final role = await _fetchRoleWithRetry(session.user.id);
        state = AppAuthState(user: session.user, role: role, isLoading: false);
      } else {
        state = AppAuthState(user: null, role: null, isLoading: false);
      }
    });
  }

  /// Retry profile fetch up to 5 times with backoff — matches Angular fix
  Future<String> _fetchRoleWithRetry(String userId, {int maxAttempts = 5, int delayMs = 500}) async {
    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        final profile = await _supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle();

        if (profile != null && profile['role'] != null) {
          return profile['role'] as String;
        }
      } catch (_) {}

      if (attempt < maxAttempts) {
        await Future.delayed(Duration(milliseconds: delayMs * attempt));
      }
    }
    return 'user'; // fallback
  }

  Future<void> signIn(String email, String password) async {
    await _supabase.auth.signInWithPassword(email: email, password: password);
  }

  Future<void> signUp(String email, String password, String name, String phone, String role) async {
    await _supabase.auth.signUp(
      email: email,
      password: password,
      data: {'full_name': name, 'phone': phone, 'role': role},
    );
  }

  Future<void> signOut() async {
    try { await _supabase.auth.signOut(); } catch (_) {}
    state = AppAuthState(user: null, role: null, isLoading: false);
  }
}
