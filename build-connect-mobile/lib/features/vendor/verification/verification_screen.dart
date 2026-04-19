import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:io';
import '../../../core/services/verification_service.dart';

class VerificationScreen extends StatefulWidget {
  final String businessId;
  const VerificationScreen({super.key, required this.businessId});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final _verificationService = VerificationService();
  final _gstController = TextEditingController();
  final _msmeController = TextEditingController();

  String _status = 'unverified';
  String _rejectionReason = '';
  String? _verifiedAt;
  File? _gstFile;
  File? _msmeFile;
  bool _isLoading = true;
  bool _isSubmitting = false;

  final _gstRegex = RegExp(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$');
  final _msmeRegex = RegExp(r'^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$');

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  Future<void> _loadStatus() async {
    final data = await _verificationService.getVerificationStatus(widget.businessId);
    if (data != null) {
      setState(() {
        _status = data['status'] == 'approved' ? 'verified' : (data['status'] ?? 'unverified');
        _rejectionReason = data['rejection_reason'] ?? '';
        _verifiedAt = data['reviewed_at'];
        _gstController.text = data['gst_number'] ?? '';
        _msmeController.text = data['msme_number'] ?? '';
      });
    } else {
      // Check business table
      final biz = await Supabase.instance.client
          .from('businesses')
          .select('verification_status, verification_rejection_reason')
          .eq('id', widget.businessId)
          .maybeSingle();
      if (biz != null) {
        setState(() {
          _status = biz['verification_status'] ?? 'unverified';
          _rejectionReason = biz['verification_rejection_reason'] ?? '';
        });
      }
    }
    setState(() => _isLoading = false);
  }

  Future<void> _pickFile(String type) async {
    final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['pdf', 'jpg', 'png', 'jpeg']);
    if (result != null && result.files.single.path != null) {
      setState(() {
        if (type == 'gst') _gstFile = File(result.files.single.path!);
        if (type == 'msme') _msmeFile = File(result.files.single.path!);
      });
    }
  }

  bool get _canSubmit {
    final hasGst = _gstController.text.isNotEmpty && _gstFile != null;
    final hasMsme = _msmeController.text.isNotEmpty && _msmeFile != null;
    if (!hasGst && !hasMsme) return false;
    if (hasGst && !_gstRegex.hasMatch(_gstController.text)) return false;
    if (hasMsme && !_msmeRegex.hasMatch(_msmeController.text)) return false;
    return true;
  }

  Future<void> _submit() async {
    if (!_canSubmit) return;
    setState(() => _isSubmitting = true);
    try {
      String? gstUrl;
      String? msmeUrl;

      if (_gstFile != null) {
        gstUrl = await _verificationService.uploadDocument(widget.businessId, _gstFile!, 'gst');
      }
      if (_msmeFile != null) {
        msmeUrl = await _verificationService.uploadDocument(widget.businessId, _msmeFile!, 'msme');
      }

      await _verificationService.submitVerification(
        businessId: widget.businessId,
        gstNumber: _gstController.text.isNotEmpty ? _gstController.text : null,
        gstCertificateUrl: gstUrl,
        msmeNumber: _msmeController.text.isNotEmpty ? _msmeController.text : null,
        msmeCertificateUrl: msmeUrl,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Documents submitted for review!'), backgroundColor: Colors.green),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
    setState(() => _isSubmitting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verification')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Status Card
                  _buildStatusCard(),
                  const SizedBox(height: 24),
                  // Upload form (only for unverified/rejected)
                  if (_status == 'unverified' || _status == 'rejected') ...[
                    _buildDocSection('GST Certificate', 'GST Number', 'e.g., 29ABCDE1234F1Z5', _gstController, _gstFile, 'gst', _gstRegex),
                    const SizedBox(height: 24),
                    _buildDocSection('MSME / Udyam Certificate', 'Udyam Number', 'e.g., UDYAM-TN-01-0012345', _msmeController, _msmeFile, 'msme', _msmeRegex),
                    const SizedBox(height: 8),
                    const Text('At least one document (GST or MSME) is required.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _isSubmitting || !_canSubmit ? null : _submit,
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                      child: _isSubmitting
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : Text(_status == 'rejected' ? 'Resubmit for Verification' : 'Submit for Verification'),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildStatusCard() {
    switch (_status) {
      case 'verified':
        return Card(
          color: const Color(0xFFE8F5E9),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                const Icon(Icons.verified, color: Color(0xFF2ECC71), size: 48),
                const SizedBox(height: 8),
                const Text('Verified Business', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF2ECC71))),
                if (_verifiedAt != null) Text('Verified on ${_verifiedAt!.substring(0, 10)}', style: const TextStyle(color: Colors.grey)),
              ],
            ),
          ),
        );
      case 'pending':
        return Card(
          color: const Color(0xFFF3E5F5),
          child: const Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                Icon(Icons.access_time, color: Colors.orange, size: 48),
                SizedBox(height: 8),
                Text('Verification Under Review', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.orange)),
                Text('Estimated 2–3 business days', style: TextStyle(color: Colors.grey)),
              ],
            ),
          ),
        );
      case 'rejected':
        return Card(
          color: const Color(0xFFFFEBEE),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                const Icon(Icons.cancel, color: Colors.red, size: 48),
                const SizedBox(height: 8),
                const Text('Verification Rejected', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.red)),
                if (_rejectionReason.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text('Reason: $_rejectionReason', style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 8),
                const Text('You can resubmit corrected documents below.', style: TextStyle(color: Colors.grey)),
              ],
            ),
          ),
        );
      default:
        return Card(
          color: const Color(0xFFFFF3E0),
          child: const Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                Icon(Icons.shield_outlined, color: Colors.orange, size: 48),
                SizedBox(height: 8),
                Text('Get Verified', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.orange)),
                Text('Upload GST/MSME documents for a Verified badge.', style: TextStyle(color: Colors.grey)),
              ],
            ),
          ),
        );
    }
  }

  Widget _buildDocSection(String title, String label, String hint, TextEditingController ctrl, File? file, String type, RegExp regex) {
    final isValid = ctrl.text.isEmpty || regex.hasMatch(ctrl.text);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextFormField(
              controller: ctrl,
              decoration: InputDecoration(
                labelText: label,
                hintText: hint,
                border: const OutlineInputBorder(),
                suffixIcon: ctrl.text.isNotEmpty
                    ? Icon(isValid ? Icons.check_circle : Icons.error, color: isValid ? Colors.green : Colors.red)
                    : null,
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => _pickFile(type),
              icon: const Icon(Icons.upload_file),
              label: Text(file != null ? file.path.split('/').last.split('\\').last : 'Upload Certificate (PDF/JPG/PNG)'),
            ),
            if (file != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(
                  children: [
                    const Icon(Icons.insert_drive_file, size: 16, color: Colors.green),
                    const SizedBox(width: 4),
                    Expanded(child: Text(file.path.split('/').last.split('\\').last, style: const TextStyle(fontSize: 12))),
                    IconButton(
                      icon: const Icon(Icons.close, size: 16),
                      onPressed: () => setState(() {
                        if (type == 'gst') _gstFile = null;
                        if (type == 'msme') _msmeFile = null;
                      }),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
