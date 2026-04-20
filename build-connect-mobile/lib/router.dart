import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'features/auth/login_screen.dart';
import 'features/auth/register_screen.dart';
import 'features/auth/pending_approval_screen.dart';
import 'features/search/home_screen.dart';
import 'features/search/search_results_screen.dart';
import 'features/search/compare_screen.dart';
import 'features/listing/business_profile_screen.dart';
import 'features/vendor/vendor_dashboard_screen.dart';
import 'features/vendor/leads_list_screen.dart';
import 'features/vendor/lead_detail_screen.dart';
import 'features/vendor/profile_editor_screen.dart';
import 'features/vendor/vendor_analytics_screen.dart';
import 'features/user/user_profile_screen.dart';
import 'features/user/saved_screen.dart';
import 'features/notifications/notifications_screen.dart';
import 'shared/screens/admin_redirect_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: false,
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(title: const Text('Error')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Color(0xFFCC0000)),
            const SizedBox(height: 16),
            const Text('Page not found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
    redirect: (context, state) {
      try {
        final session = Supabase.instance.client.auth.currentSession;
        final loc = state.matchedLocation;

        // Public routes
        final publicRoutes = ['/', '/login', '/register', '/search', '/compare', '/pending-approval'];
        if (publicRoutes.any((r) => loc == r) || loc.startsWith('/business/') || loc.startsWith('/search/')) {
          return null;
        }

        // Protected routes need session
        if (session == null) return '/login';

        return null;
      } catch (e) {
        return null;
      }
    },
    routes: [
      // PUBLIC
      GoRoute(path: '/', builder: (c, s) => const HomeScreen()),
      GoRoute(path: '/login', builder: (c, s) => const LoginScreen()),
      GoRoute(path: '/register', builder: (c, s) => const RegisterScreen()),
      GoRoute(path: '/pending-approval', builder: (c, s) => const PendingApprovalScreen()),
      GoRoute(path: '/search', builder: (c, s) => const SearchResultsScreen()),
      GoRoute(path: '/compare', builder: (c, s) => const CompareScreen()),
      GoRoute(
        path: '/business/:id',
        builder: (c, s) => BusinessProfileScreen(businessId: s.pathParameters['id']!),
      ),

      // USER
      GoRoute(path: '/profile', builder: (c, s) => const UserProfileScreen()),
      GoRoute(path: '/saved', builder: (c, s) => const SavedScreen()),
      GoRoute(path: '/notifications', builder: (c, s) => const NotificationsScreen()),

      // VENDOR (shell with bottom nav)
      ShellRoute(
        builder: (context, state, child) => VendorShell(child: child),
        routes: [
          GoRoute(path: '/vendor/dashboard', builder: (c, s) => const VendorDashboardScreen()),
          GoRoute(path: '/vendor/leads', builder: (c, s) => const LeadsListScreen()),
          GoRoute(path: '/vendor/analytics', builder: (c, s) => const VendorAnalyticsScreen()),
          GoRoute(path: '/vendor/profile', builder: (c, s) => const ProfileEditorScreen()),
        ],
      ),
      GoRoute(
        path: '/vendor/lead/:id',
        builder: (c, s) => LeadDetailScreen(leadId: s.pathParameters['id']!),
      ),

      // ADMIN
      GoRoute(path: '/admin', builder: (c, s) => const AdminRedirectScreen()),
    ],
  );
});

/// Vendor shell with persistent bottom navigation bar
class VendorShell extends StatelessWidget {
  final Widget child;
  const VendorShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    int currentIndex = 0;
    if (location.startsWith('/vendor/leads')) currentIndex = 1;
    if (location.startsWith('/vendor/analytics')) currentIndex = 2;
    if (location.startsWith('/vendor/profile')) currentIndex = 3;

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        backgroundColor: const Color(0xFF0A1628),
        indicatorColor: const Color(0xFFCC0000),
        selectedIndex: currentIndex,
        onDestinationSelected: (i) {
          final routes = ['/vendor/dashboard', '/vendor/leads', '/vendor/analytics', '/vendor/profile'];
          context.go(routes[i]);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined, color: Colors.white54),
            selectedIcon: Icon(Icons.dashboard, color: Colors.white),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.inbox_outlined, color: Colors.white54),
            selectedIcon: Icon(Icons.inbox, color: Colors.white),
            label: 'Leads',
          ),
          NavigationDestination(
            icon: Icon(Icons.analytics_outlined, color: Colors.white54),
            selectedIcon: Icon(Icons.analytics, color: Colors.white),
            label: 'Analytics',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline, color: Colors.white54),
            selectedIcon: Icon(Icons.person, color: Colors.white),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
