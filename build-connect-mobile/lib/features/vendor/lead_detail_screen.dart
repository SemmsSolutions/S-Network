import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class LeadDetailScreen extends StatefulWidget {
  final String leadId;

  const LeadDetailScreen({super.key, required this.leadId});

  @override
  State<LeadDetailScreen> createState() => _LeadDetailScreenState();
}

class _LeadDetailScreenState extends State<LeadDetailScreen> {
  Map<String, dynamic>? _lead;
  bool _isLoading = true;
  String _currentStatus = 'new';

  @override
  void initState() {
    super.initState();
    _fetchLead();
  }

  Future<void> _fetchLead() async {
    try {
      final res = await Supabase.instance.client.from('leads').select('*').eq('id', widget.leadId).single();
      setState(() {
        _lead = res;
        _currentStatus = res['status'];
        _isLoading = false;
      });
    } catch(e) {
      debugPrint('Error: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    try {
      final res = await Supabase.instance.client.functions.invoke('update-lead-status', body: {
        'lead_id': widget.leadId,
        'status': newStatus
      });
      if (res.data != null && !res.data.containsKey('error')) {
        setState(() => _currentStatus = newStatus);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Status updated')));
      }
    } catch(e) {
      debugPrint('Error updating status: $e');
    }
  }

  Future<void> _launchUrl(String urlString) async {
    final Uri uri = Uri.parse(urlString);
    if (!await launchUrl(uri)) {
      debugPrint('Could not launch $uri');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_lead == null) return const Scaffold(body: Center(child: Text('Lead not found')));

    return Scaffold(
      appBar: AppBar(title: const Text('Lead Details')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Client Details', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            Text(_lead!['user_name'] ?? 'Unknown', style: Theme.of(context).textTheme.headlineSmall),
            Text(_lead!['user_phone'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 16)),
            if (_lead!['user_email'] != null && _lead!['user_email'].toString().isNotEmpty)
              Text('📧 ${_lead!['user_email']}', style: const TextStyle(color: Colors.grey, fontSize: 16)),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _launchUrl('tel:${_lead!['user_phone']}'),
                    icon: const Icon(Icons.phone),
                    label: const Text('Call Client'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                    onPressed: () => _launchUrl('https://wa.me/${_lead!['user_phone']?.replaceAll('+', '')}'),
                    icon: const Icon(Icons.chat),
                    label: const Text('WhatsApp'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            Text('Project Details', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            _buildDetailRow('Type', _lead!['project_type']),
            _buildDetailRow('Budget', '₹${_lead!['budget_min']} - ₹${_lead!['budget_max']}'),
            _buildDetailRow('Timeline', _lead!['timeline'] ?? 'Not Specified'),
            const SizedBox(height: 24),
            Text('Message', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
              child: Text(_lead!['message'] ?? '', style: const TextStyle(fontSize: 16)),
            ),
            const SizedBox(height: 32),
            Text('Status Management', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _currentStatus,
              decoration: const InputDecoration(labelText: 'Lead Status'),
              items: ['new', 'contacted', 'converted', 'lost']
                  .map((e) => DropdownMenuItem(value: e, child: Text(e.toUpperCase())))
                  .toList(),
              onChanged: (val) {
                if (val != null) _updateStatus(val);
              },
            )
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 100, child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.bold))),
        ],
      ),
    );
  }
}
