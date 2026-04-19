import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class LeadFormSheet extends StatefulWidget {
  final String businessId;

  const LeadFormSheet({super.key, required this.businessId});

  @override
  State<LeadFormSheet> createState() => _LeadFormSheetState();
}

class _LeadFormSheetState extends State<LeadFormSheet> {
  String _projectType = 'New Construction';
  RangeValues _budget = const RangeValues(10000, 500000);
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user != null) {
      _emailCtrl.text = user.email ?? '';
      try {
        final profile = await Supabase.instance.client.from('profiles').select('name, phone').eq('id', user.id).maybeSingle();
        if (profile != null) {
          _nameCtrl.text = profile['name'] ?? '';
          _phoneCtrl.text = profile['phone'] ?? '';
        }
      } catch (_) {}
    }
  }

  Future<void> _submit() async {
    if (_nameCtrl.text.trim().isEmpty || _phoneCtrl.text.trim().isEmpty || _emailCtrl.text.trim().isEmpty || _descCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all contact details and description.')));
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final res = await Supabase.instance.client.functions.invoke('create-lead', body: {
        'business_id': widget.businessId,
        'user_name': _nameCtrl.text.trim(),
        'user_phone': _phoneCtrl.text.trim(),
        'user_email': _emailCtrl.text.trim(),
        'message': _descCtrl.text.trim(),
        'budget_min': _budget.start.toInt(),
        'budget_max': _budget.end.toInt(),
        'project_type': _projectType,
        'timeline': 'Not Specified', // Extensible later
      });

      if (res.data != null && !res.data.containsKey('error')) {
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Quote Request Sent!')));
        }
      } else {
        throw Exception('Failed to create lead.');
      }
    } catch(e) {
      debugPrint('Error creating lead: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        left: 24,
        right: 24,
        top: 32,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Request a Quote', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 24),
            
            Text('Project Type', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _projectType,
              decoration: const InputDecoration(),
              items: ['New Construction', 'Renovation', 'Repair', 'Consultation']
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: (val) => setState(() => _projectType = val!),
            ),
            
            const SizedBox(height: 24),
            Text('Estimated Budget (₹${_budget.start.toInt()} - ₹${_budget.end.toInt()})', style: Theme.of(context).textTheme.labelLarge),
            RangeSlider(
              values: _budget,
              min: 0,
              max: 1000000,
              divisions: 100,
              activeColor: Theme.of(context).colorScheme.primary,
              labels: RangeLabels(
                '₹${_budget.start.toInt()}',
                '₹${_budget.end.toInt()}',
              ),
              onChanged: (val) => setState(() => _budget = val),
            ),
            
            const SizedBox(height: 16),
            Text('Contact Details', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            TextField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone Number', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email Address', border: OutlineInputBorder()),
            ),

            const SizedBox(height: 24),
            Text('Project Description', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            TextField(
              controller: _descCtrl,
              maxLines: 4,
              decoration: const InputDecoration(hintText: 'Describe your requirements...', border: OutlineInputBorder()),
            ),
            
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              child: _isSubmitting 
                ? const CircularProgressIndicator(color: Colors.white) 
                : const Text('Submit Request', style: TextStyle(fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}
