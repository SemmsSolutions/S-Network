import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/services/auth_service.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/register_screen.dart';
import 'features/auth/pending_approval_screen.dart';
import 'features/vendor/vendor_dashboard_screen.dart';
import 'features/vendor/leads_list_screen.dart';
import 'features/vendor/lead_detail_screen.dart';
import 'features/vendor/profile_editor_screen.dart';
import 'features/user/onboarding_screen.dart';
import 'features/search/compare_screen.dart';
import 'features/search/home_screen.dart';
import 'features/search/search_results_screen.dart';
import 'features/listing/business_profile_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/home',
    debugLogDiagnostics: false,
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(children: [
          const Text('Page not found'),
          ElevatedButton(
            onPressed: () => context.go('/home'),
            child: const Text('Go Home'),
          )
        ]),
      ),
    ),
    redirect: (context, state) {
      try {
        final session = Supabase.instance.client.auth.currentSession;
        
        final isAuth = session != null;
        final isLoggingIn = state.uri.toString() == '/login' || state.uri.toString() == '/register';
        final isPendingPage = state.uri.toString() == '/pending-approval';

        final isPublicRoute = state.uri.toString() == '/home' || 
                              state.uri.toString() == '/search' || 
                              state.uri.toString().startsWith('/business/');

        if (!isAuth && !isLoggingIn && !isPublicRoute) {
          return '/login';
        }

        return null;
      } catch (e) {
        return null; // Never crash on redirect
      }
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/pending-approval',
        builder: (context, state) => const PendingApprovalScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/search',
        builder: (context, state) => const SearchResultsScreen(),
      ),
      GoRoute(
        path: '/compare',
        builder: (context, state) => const CompareScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/business/:id',
        builder: (context, state) => BusinessProfileScreen(businessId: state.pathParameters["id"]!),
      ),
      GoRoute(
        path: '/vendor/dashboard',
        builder: (context, state) => const VendorDashboardScreen(),
      ),
      GoRoute(
        path: '/vendor/leads',
        builder: (context, state) => const LeadsListScreen(),
      ),
      GoRoute(
        path: '/vendor/lead/:id',
        builder: (context, state) => LeadDetailScreen(leadId: state.pathParameters["id"]!),
      ),
      GoRoute(
        path: '/vendor/profile',
        builder: (context, state) => const ProfileEditorScreen(),
      ),
    ],
  );
});
