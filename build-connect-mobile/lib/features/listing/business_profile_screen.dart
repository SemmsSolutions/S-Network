import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'lead_form_sheet.dart';
import '../../core/services/material_service.dart';
import '../../shared/models/material_model.dart';

class BusinessProfileScreen extends StatefulWidget {
  final String businessId;

  const BusinessProfileScreen({super.key, required this.businessId});

  @override
  State<BusinessProfileScreen> createState() => _BusinessProfileScreenState();
}

class _BusinessProfileScreenState extends State<BusinessProfileScreen> {
  Map<String, dynamic>? _business;
  List<Map<String, dynamic>> _images = [];
  List<Map<String, dynamic>> _faqs = [];
  
  // Materials state
  final Map<String, List<BusinessMaterial>> _materialsByGroup = {};
  
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchDetails();
  }

  Future<void> _fetchDetails() async {
    try {
      final res = await Supabase.instance.client
          .from('businesses')
          .select('*, categories(name), business_images(id, image_url), business_faqs(id, question, answer)')
          .eq('id', widget.businessId)
          .single();

      final materialService = MaterialService();
      final groups = await materialService.getMaterialGroups();
      final bMats = await materialService.getBusinessMaterials(widget.businessId);
      
      for (var bm in bMats) {
        if (bm.materialItems != null) {
          final group = groups.where((g) => g.id == bm.materialItems!.groupId).firstOrNull;
          if (group != null) {
            final title = '${group.icon ?? ''} ${group.name}';
            _materialsByGroup.putIfAbsent(title, () => []).add(bm);
          }
        }
      }

      setState(() {
        _business = res;
        _images = List<Map<String, dynamic>>.from(res['business_images'] ?? []);
        _faqs = List<Map<String, dynamic>>.from(res['business_faqs'] ?? []);
        _isLoading = false;
      });
    } catch(e) {
      debugPrint('Error fetching business details: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _launchUrl(String urlString) async {
    final Uri uri = Uri.parse(urlString);
    if (!await launchUrl(uri)) {
      debugPrint('Could not launch $uri');
    }
  }

  Future<void> _handleCall(String phone) async {
    try {
      await Supabase.instance.client.functions.invoke('log-call-lead', body: {'business_id': widget.businessId});
    } catch(e) {
      debugPrint('Error logging call: $e');
    }
    _launchUrl('tel:$phone');
  }

  void _showReportSheet() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Report Business', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                 try {
                   await Supabase.instance.client.from('reported_businesses').insert({
                      'business_id': widget.businessId,
                      'reason': 'Other',
                      'reporter_id': Supabase.instance.client.auth.currentUser?.id
                   });
                 } catch(e) {
                   debugPrint('Error reporting: $e');
                 }
                 if (mounted) {
                   Navigator.pop(ctx);
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Business reported')));
                 }
              }, 
              child: const Text('Submit Report')
            )
          ]
        )
      )
    );
  }

  void _showLeadForm() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => LeadFormSheet(businessId: widget.businessId),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_business == null) {
      return const Scaffold(body: Center(child: Text('Business not found')));
    }

    final name = _business!['name'];
    final category = _business!['categories']?['name'] ?? 'Contractor';
    final location = '${_business!['address'] ?? ''}, ${_business!['city'] ?? ''}';
    final description = _business!['description'] ?? 'No description provided.';
    final rating = _business!['rating']?.toDouble() ?? 0.0;
    final reviews = _business!['total_reviews'] ?? 0;
    final phone = _business!['phone'];
    final whatsapp = _business!['whatsapp'];
    final responseRate = _business!['response_rate'] ?? 0;
    final responseTime = _business!['avg_response_time_hours'] ?? 0;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            actions: [
              IconButton(
                icon: const Icon(Icons.share),
                onPressed: () {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Shared via standard platform sheet')));
                }
              ),
              PopupMenuButton<String>(
                onSelected: (val) {
                  if (val == 'report') _showReportSheet();
                },
                itemBuilder: (ctx) => [
                  const PopupMenuItem(value: 'report', child: Text('Report this business')),
                ],
              )
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: _images.isNotEmpty
                  ? PageView.builder(
                      itemCount: _images.length,
                      itemBuilder: (context, index) {
                        return CachedNetworkImage(
                          imageUrl: _images[index]['image_url'],
                          fit: BoxFit.cover,
                          placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                          errorWidget: (context, url, err) => const Icon(Icons.broken_image),
                        );
                      },
                    )
                  : Container(
                      color: Colors.grey[200],
                      child: const Icon(Icons.business, size: 80, color: Colors.grey),
                    ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Badges
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(category.toUpperCase(), style: TextStyle(color: Theme.of(context).colorScheme.primary, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 8),
                      if (_business!['is_verified'] == true)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(4)),
                          child: const Text('Verified', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Title
                  Text(name, style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 4),
                  Text('📍 $location', style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  // Rating
                  Row(
                    children: [
                      const Icon(Icons.star, color: Colors.orange, size: 20),
                      const SizedBox(width: 4),
                      Text('$rating', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(width: 4),
                      Text('($reviews reviews)', style: const TextStyle(color: Colors.grey)),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Action Buttons
                  Row(
                    children: [
                      if (phone != null && phone.toString().isNotEmpty)
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _handleCall(phone.toString()),
                            icon: const Icon(Icons.phone),
                            label: const Text('Call'),
                            style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)),
                          ),
                        ),
                      if (phone != null && whatsapp != null) const SizedBox(width: 12),
                      if (whatsapp != null && whatsapp.toString().isNotEmpty)
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _launchUrl('https://wa.me/$whatsapp'),
                            icon: const Icon(Icons.chat),
                            label: const Text('WhatsApp'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  Text('Trust Signals', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text('Responds to $responseRate% of enquiries', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                  Text('Usually responds within ${responseTime}h', style: const TextStyle(color: Colors.green)),
                  const SizedBox(height: 24),
                  
                  // Materials Section
                  if (_materialsByGroup.isNotEmpty) ...[
                    Text('Materials & Products', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    ..._materialsByGroup.entries.map((entry) => ExpansionTile(
                      initiallyExpanded: true,
                      title: Text(entry.key, style: const TextStyle(fontWeight: FontWeight.bold)),
                      children: entry.value.map((bm) => ListTile(
                        leading: const Icon(Icons.check_circle, color: Colors.blue, size: 16),
                        title: Text(bm.materialItems?.name ?? ''),
                        subtitle: bm.customDescription != null && bm.customDescription!.isNotEmpty 
                            ? Text(bm.customDescription!) 
                            : null,
                      )).toList(),
                    )).toList(),
                    const SizedBox(height: 24),
                  ],

                  // About
                  Text('About', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(description, style: const TextStyle(height: 1.5, fontSize: 16)),
                  if (_faqs.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Text('FAQs', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    ..._faqs.map((faq) => ExpansionTile(
                      title: Text(faq['question']),
                      children: [Padding(padding: const EdgeInsets.all(16), child: Text(faq['answer']))],
                    )).toList(),
                  ],
                  const SizedBox(height: 100), // padding for FAB
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showLeadForm,
        backgroundColor: Theme.of(context).colorScheme.primary,
        icon: const Icon(Icons.request_quote),
        label: const Text('Request Quote', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}
