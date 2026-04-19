import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';

class VerificationService {
  final _supabase = Supabase.instance.client;

  Future<Map<String, dynamic>?> getVerificationStatus(String businessId) async {
    final res = await _supabase
        .from('vendor_verifications')
        .select()
        .eq('business_id', businessId)
        .maybeSingle();
    return res;
  }

  Future<String> uploadDocument(String businessId, File file, String type) async {
    final ext = file.path.split('.').last;
    final path = 'verifications/$businessId/$type-certificate.$ext';
    await _supabase.storage.from('s-network-media').upload(path, file, fileOptions: const FileOptions(upsert: true));
    final url = _supabase.storage.from('s-network-media').getPublicUrl(path);
    return url;
  }

  Future<Map<String, dynamic>> submitVerification({
    required String businessId,
    String? gstNumber,
    String? gstCertificateUrl,
    String? msmeNumber,
    String? msmeCertificateUrl,
  }) async {
    final res = await _supabase.functions.invoke('submit-verification', body: {
      'business_id': businessId,
      'gst_number': gstNumber,
      'gst_certificate_url': gstCertificateUrl,
      'msme_number': msmeNumber,
      'msme_certificate_url': msmeCertificateUrl,
    });
    if (res.status != 200) throw Exception(res.data['error'] ?? 'Submission failed');
    return res.data;
  }
}
