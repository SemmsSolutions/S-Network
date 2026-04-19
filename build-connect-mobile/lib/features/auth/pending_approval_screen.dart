import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class PendingApprovalScreen extends StatefulWidget {
  const PendingApprovalScreen({super.key});

  @override
  State<PendingApprovalScreen> createState() => _PendingApprovalScreenState();
}

class _PendingApprovalScreenState extends State<PendingApprovalScreen> {
  Map<String, dynamic>? verificationData;

  @override
  void initState() {
    super.initState();
    _loadVerification();
  }

  Future<void> _loadVerification() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    final biz = await Supabase.instance.client
        .from('businesses')
        .select('id, name')
        .eq('owner_id', user.id)
        .maybeSingle();

    if (biz != null) {
      final ver = await Supabase.instance.client
          .from('vendor_verifications')
          .select('*')
          .eq('business_id', biz['id'])
          .maybeSingle();

      if (ver != null) {
        ver['business_name'] = biz['name'];
        setState(() => verificationData = ver);
      }
    }
  }

  Future<void> _logout() async {
    await Supabase.instance.client.auth.signOut();
    if (mounted) {
      Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F5F0),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(40),
                  ),
                  child: const Center(child: Text('🕐', style: TextStyle(fontSize: 40))),
                ),
                const SizedBox(height: 24),
                const Text('Account Under Review',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFE85D26))),
                const SizedBox(height: 16),
                const Text(
                  'Your registration is successful. Our admin team is reviewing your documents.\nYou will receive an email once your account is approved.\nThis usually takes 1–2 business days.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: Colors.grey, height: 1.6),
                ),
                const SizedBox(height: 32),
                if (verificationData != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Submission Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 8),
                        if (verificationData!['business_name'] != null)
                          Text('Business: ${verificationData!['business_name']}', style: const TextStyle(fontSize: 13)),
                        if (verificationData!['gst_number'] != null)
                          Text('GST: ${verificationData!['gst_number']}', style: const TextStyle(fontSize: 13)),
                        if (verificationData!['msme_number'] != null)
                          Text('MSME: ${verificationData!['msme_number']}', style: const TextStyle(fontSize: 13)),
                        if (verificationData!['status'] == 'rejected')
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text('❌ Rejected: ${verificationData!['rejection_reason']}',
                                style: const TextStyle(fontSize: 13, color: Colors.red, fontWeight: FontWeight.bold)),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _logout,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('Logout', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
