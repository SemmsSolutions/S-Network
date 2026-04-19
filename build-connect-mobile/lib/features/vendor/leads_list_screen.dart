import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';

class LeadsListScreen extends StatefulWidget {
  const LeadsListScreen({super.key});

  @override
  State<LeadsListScreen> createState() => _LeadsListScreenState();
}

class _LeadsListScreenState extends State<LeadsListScreen> {
  List<Map<String, dynamic>> _leads = [];
  bool _isLoading = true;
  String _filter = 'All';

  @override
  void initState() {
    super.initState();
    _fetchLeads();
  }

  Future<void> _fetchLeads() async {
    setState(() => _isLoading = true);
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      
      final biz = await Supabase.instance.client.from('businesses').select('id').eq('owner_id', user.id).maybeSingle();
      if (biz == null) return;

      var query = Supabase.instance.client.from('leads').select('*').eq('business_id', biz['id']);
      
      if (_filter != 'All') {
        query = query.eq('status', _filter.toLowerCase());
      }

      final res = await query.order('created_at');
      setState(() {
         _leads = List<Map<String, dynamic>>.from(res);
      });
    } catch(e) {
      debugPrint('Error fetching leads: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inbox'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                const Text('Filter: ', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: _filter,
                  items: ['All', 'New', 'Contacted', 'Converted', 'Lost'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() => _filter = val);
                      _fetchLeads();
                    }
                  },
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _fetchLeads,
                  child: _leads.isEmpty
                    ? ListView(
                        children: const [
                          SizedBox(height: 100),
                          Center(child: Text('No leads found.', style: TextStyle(color: Colors.grey, fontSize: 16)))
                        ])
                    : ListView.separated(
                        itemCount: _leads.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final lead = _leads[index];
                          Color statusColor = Colors.blue;
                          if (lead['status'] == 'contacted') statusColor = Colors.amber.shade700;
                          if (lead['status'] == 'converted') statusColor = Colors.green;
                          if (lead['status'] == 'lost') statusColor = Colors.red;

                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            title: Text(lead['user_name'] ?? 'Anonymous User', style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text('${lead['project_type']} • ₹${lead['budget_max'] ?? 'N/A'}'),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                              child: Text((lead['status'] as String).toUpperCase(), style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                            onTap: () => context.push('/vendor/lead/${lead['id']}'),
                          );
                        },
                      ),
                ),
          ),
        ],
      ),
    );
  }
}
