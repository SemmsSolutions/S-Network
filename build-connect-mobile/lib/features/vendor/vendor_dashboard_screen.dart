import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../core/services/auth_service.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

class VendorDashboardScreen extends ConsumerStatefulWidget {
  const VendorDashboardScreen({super.key});

  @override
  ConsumerState<VendorDashboardScreen> createState() => _VendorDashboardScreenState();
}

class _VendorDashboardScreenState extends ConsumerState<VendorDashboardScreen> {
  int _selectedIndex = 0;
  Map<String, dynamic> _stats = {
    'total_leads': 0, 'new_leads': 0, 'profile_views': 0, 'conversion_rate': 0
  };
  bool _isLoading = true;
  RealtimeChannel? _leadsChannel;
  Map<String, dynamic>? _business;
  double _completeness = 0.0;
  bool _isOnVacation = false;

  void _calculateCompleteness(Map<String, dynamic> biz) {
    int filled = 0;
    int total = 8;
    if (biz['name'] != null && biz['name'].toString().isNotEmpty) filled++;
    if (biz['description'] != null && biz['description'].toString().isNotEmpty) filled++;
    if (biz['phone'] != null && biz['phone'].toString().isNotEmpty) filled++;
    if (biz['address'] != null && biz['address'].toString().isNotEmpty) filled++;
    if (biz['category_id'] != null) filled++;
    if (biz['business_images'] != null && (biz['business_images'] as List).isNotEmpty) filled++;
    if (biz['service_areas'] != null && (biz['service_areas'] as List).isNotEmpty) filled++;
    if (biz['working_hours'] != null) filled++;
    _completeness = filled / total;
  }

  Future<void> _loadBusiness() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    
    try {
      final biz = await Supabase.instance.client.from('businesses').select('*, business_images(id)').eq('owner_id', user.id).maybeSingle();
      if (biz != null && mounted) {
        setState(() {
          _business = biz;
          _isOnVacation = biz['is_on_vacation'] == true;
          _calculateCompleteness(biz);
        });
      }
    } catch(e) {
      debugPrint('Error loading business: $e');
    }
  }

  @override
  void initState() {
    super.initState();
    _initNotifications();
    _loadBusiness();
    _loadStats();
    _setupRealtime();
  }

  Future<void> _initNotifications() async {
    const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings initializationSettingsIOS = DarwinInitializationSettings();
    const InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
        iOS: initializationSettingsIOS);
    await flutterLocalNotificationsPlugin.initialize(initializationSettings);
  }

  Future<void> _showNotification(String title, String body) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails('leads_channel', 'New Leads',
            importance: Importance.max, priority: Priority.high, showWhen: false);
    const NotificationDetails platformChannelSpecifics =
        NotificationDetails(android: androidPlatformChannelSpecifics);
    await flutterLocalNotificationsPlugin.show(
        0, title, body, platformChannelSpecifics, payload: 'leads_inbox');
  }

  Future<void> _setupRealtime() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    
    final biz = await Supabase.instance.client.from('businesses').select('id').eq('owner_id', user.id).maybeSingle();
    if (biz == null) return;

    _leadsChannel = Supabase.instance.client.channel('public:leads')
      .onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'leads',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'business_id',
          value: biz['id'],
        ),
        callback: (payload) {
          _showNotification('New Lead Alert!', 'You have received a new quote request.');
          _loadStats();
        },
      )
      .subscribe();
  }

  Future<void> _loadStats() async {
    try {
      final res = await Supabase.instance.client.functions.invoke('get-vendor-analytics', method: HttpMethod.get);
      if (res.data != null && res.data['analytics'] != null) {
        if (mounted) {
          setState(() {
            _stats = res.data['analytics'];
            // MVP mock new leads
            _stats['new_leads'] = (_stats['total_leads'] as int) > 0 ? 1 : 0; 
            _isLoading = false;
          });
        }
      }
    } catch(e) {
      debugPrint('Error loading stats: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _leadsChannel?.unsubscribe();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vendor Portal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authServiceProvider.notifier).signOut(),
          )
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : ListView(
            padding: const EdgeInsets.all(24),
            children: [
               Text('Dashboard Overview', style: Theme.of(context).textTheme.headlineSmall),
               const SizedBox(height: 24),
               Row(
                 children: [
                   Expanded(child: _StatCard(title: 'Total Leads', value: _stats['total_leads'].toString())),
                   const SizedBox(width: 16),
                   Expanded(child: _StatCard(title: 'New Leads Today', value: _stats['new_leads'].toString(), primary: true)),
                 ],
               ),
               const SizedBox(height: 16),
               Row(
                 children: [
                   Expanded(child: _StatCard(title: 'Profile Views', value: _stats['profile_views'].toString())),
                   const SizedBox(width: 16),
                   Expanded(child: _StatCard(title: 'Conv. Rate', value: '${_stats['conversion_rate'] ?? 0}%')),
                 ],
               ),
               const SizedBox(height: 48),
               if (_business != null) ...[
                 SwitchListTile(
                   title: const Text('Mark as On Vacation', style: TextStyle(fontWeight: FontWeight.bold)),
                   subtitle: const Text('Your profile will be hidden from search while on vacation.', style: TextStyle(fontSize: 12)),
                   value: _isOnVacation,
                   activeColor: Colors.red,
                   contentPadding: EdgeInsets.zero,
                   onChanged: (val) async {
                     setState(() => _isOnVacation = val);
                     await Supabase.instance.client.from('businesses').update({'is_on_vacation': val}).eq('id', _business!['id']);
                   },
                 ),
                 const SizedBox(height: 16),
                 Column(
                   crossAxisAlignment: CrossAxisAlignment.start,
                   children: [
                     Row(
                       mainAxisAlignment: MainAxisAlignment.spaceBetween,
                       children: [
                         const Text('Profile Completeness', style: TextStyle(fontWeight: FontWeight.bold)),
                         Text('${(_completeness * 100).toInt()}%', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
                       ],
                     ),
                     const SizedBox(height: 8),
                     LinearProgressIndicator(
                       value: _completeness,
                       backgroundColor: Colors.grey.shade200,
                       valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).colorScheme.primary),
                       minHeight: 8,
                       borderRadius: BorderRadius.circular(4),
                     ),
                     if (_completeness < 1.0)
                       const Padding(
                         padding: EdgeInsets.only(top: 8.0),
                         child: Text('Complete your profile to get more leads.', style: TextStyle(color: Colors.orange, fontSize: 12)),
                       ),
                   ],
                 ),
                 const SizedBox(height: 32),
               ],
               ElevatedButton(
                 onPressed: () => context.push('/vendor/leads'),
                 style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
                 child: const Text('View All Leads', style: TextStyle(fontSize: 16)),
               )
            ],
          ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        selectedItemColor: Theme.of(context).colorScheme.primary,
        onTap: (idx) {
          setState(() => _selectedIndex = idx);
          if (idx == 1) context.push('/vendor/leads');
          if (idx == 2) context.push('/vendor/profile');
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.inbox), label: 'Leads'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final bool primary;

  const _StatCard({required this.title, required this.value, this.primary = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: primary ? Theme.of(context).colorScheme.primary : Colors.grey.shade200, width: primary ? 2 : 1),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))
        ]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(color: Colors.grey.shade600, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
          const SizedBox(height: 8),
          Text(value, style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            color: primary ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.secondary
          )),
        ],
      ),
    );
  }
}
