import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class VendorAnalyticsScreen extends StatefulWidget {
  const VendorAnalyticsScreen({super.key});

  @override
  State<VendorAnalyticsScreen> createState() => _VendorAnalyticsScreenState();
}

class _VendorAnalyticsScreenState extends State<VendorAnalyticsScreen> {
  Map<String, dynamic> _stats = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    try {
      final userId = Supabase.instance.client.auth.currentUser?.id;
      if (userId == null) return;

      final business = await Supabase.instance.client
          .from('businesses')
          .select('id')
          .eq('owner_id', userId)
          .maybeSingle();

      if (business == null) return;

      final res = await Supabase.instance.client.functions.invoke(
        'get-vendor-analytics',
        body: {'business_id': business['id']},
      );

      if (res.data != null) {
        setState(() {
          _stats = Map<String, dynamic>.from(res.data);
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Analytics error: $e');
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Analytics')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadAnalytics,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildStatCard('Total Leads', '${_stats['total_leads'] ?? 0}', Icons.inbox),
                  _buildStatCard('Conversion Rate', '${_stats['conversion_rate'] ?? 0}%', Icons.trending_up),
                  _buildStatCard('Profile Views', '${_stats['total_views'] ?? 0}', Icons.visibility),
                  _buildStatCard('New Leads', '${_stats['new_leads'] ?? 0}', Icons.fiber_new),
                  _buildStatCard('Contacted', '${_stats['contacted_leads'] ?? 0}', Icons.phone_callback),
                  _buildStatCard('Converted', '${_stats['converted_leads'] ?? 0}', Icons.check_circle),
                ],
              ),
            ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: const Color(0xFFCC0000).withValues(alpha: 0.1),
          child: Icon(icon, color: const Color(0xFFCC0000)),
        ),
        title: Text(label, style: const TextStyle(color: Color(0xFF6B7A99), fontSize: 13)),
        trailing: Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Color(0xFF0A1628))),
      ),
    );
  }
}
