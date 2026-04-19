import 'dart:io';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/services/material_service.dart';
import '../../shared/models/material_model.dart';

class _EditorItem {
  final MaterialItem item;
  bool selected;
  String customDesc;
  _EditorItem(this.item, {this.selected = false, this.customDesc = ''});
}

class _EditorGroup {
  final MaterialGroup group;
  final List<_EditorItem> items;
  _EditorGroup(this.group, this.items);
}

class ProfileEditorScreen extends StatefulWidget {
  const ProfileEditorScreen({super.key});

  @override
  State<ProfileEditorScreen> createState() => _ProfileEditorScreenState();
}

class _ProfileEditorScreenState extends State<ProfileEditorScreen> {
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _whatsappCtrl = TextEditingController();
  String? _businessId;
  bool _isLoading = true;
  bool _isSaving = false;
  List<Map<String, dynamic>> _images = [];
  List<Map<String, dynamic>> _faqs = [];
  List<_EditorGroup> _editorGroups = [];
  final MaterialService _materialService = MaterialService();

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;

      final biz = await Supabase.instance.client.from('businesses').select('*').eq('owner_id', user.id).maybeSingle();
      if (biz != null) {
        _businessId = biz['id'];
        _nameCtrl.text = biz['name'] ?? '';
        _descCtrl.text = biz['description'] ?? '';
        _cityCtrl.text = biz['city'] ?? '';
        _whatsappCtrl.text = biz['whatsapp'] ?? '';

        final imgs = await Supabase.instance.client.from('business_images').select('*').eq('business_id', _businessId!);
        final faqsData = await Supabase.instance.client.from('business_faqs').select('*').eq('business_id', _businessId!);
        
        final groups = await _materialService.getMaterialGroups();
        final bMats = await _materialService.getBusinessMaterials(_businessId!);
        final tempEditorGroups = <_EditorGroup>[];
        for (var g in groups) {
          final items = await _materialService.getMaterialItems(g.id);
          final editorItems = items.map((i) {
            final match = bMats.where((bm) => bm.materialItemId == i.id).firstOrNull;
            return _EditorItem(i, selected: match != null, customDesc: match?.customDescription ?? '');
          }).toList();
          tempEditorGroups.add(_EditorGroup(g, editorItems));
        }

        if (mounted) setState(() {
          _images = List<Map<String, dynamic>>.from(imgs);
          _faqs = List<Map<String, dynamic>>.from(faqsData);
          _editorGroups = tempEditorGroups;
          _isLoading = false;
        });
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch(e) {
      debugPrint('Error fetching profile: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveProfile() async {
    if (_businessId == null) return;
    setState(() => _isSaving = true);
    try {
      await Supabase.instance.client.from('businesses').update({
        'name': _nameCtrl.text,
        'description': _descCtrl.text,
        'city': _cityCtrl.text,
        'whatsapp': _whatsappCtrl.text,
      }).eq('id', _businessId!);

      final selections = <Map<String, dynamic>>[];
      for (var g in _editorGroups) {
        for (var i in g.items) {
          if (i.selected) {
            selections.add({'itemId': i.item.id, 'desc': i.customDesc});
          }
        }
      }
      await _materialService.updateBusinessMaterials(_businessId!, selections);

      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile saved')));
    } catch(e) {
      debugPrint('Error saving: $e');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _uploadImage() async {
    if (_businessId == null) return;
    
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile == null) return;

    final file = File(pickedFile.path);
    final ext = pickedFile.name.split('.').last;
    final path = 'businesses/$_businessId/portfolio/${DateTime.now().millisecondsSinceEpoch}.$ext';

    setState(() => _isLoading = true);
    try {
      await Supabase.instance.client.storage.from('s-network-media').upload(path, file);
      final url = Supabase.instance.client.storage.from('s-network-media').getPublicUrl(path);
      
      final newImg = await Supabase.instance.client.from('business_images').insert({
        'business_id': _businessId,
        'image_url': url,
        'caption': ''
      }).select().single();
      
      setState(() {
        _images.add(newImg);
      });
    } catch(e) {
      debugPrint('Error uploading image: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteImage(String id) async {
    try {
      await Supabase.instance.client.from('business_images').delete().eq('id', id);
      setState(() {
        _images.removeWhere((img) => img['id'] == id);
      });
    } catch(e) {
      debugPrint('Error deleting image: $e');
    }
  }

  Future<void> _addFaq() async {
    final qCtrl = TextEditingController();
    final aCtrl = TextEditingController();
    
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add FAQ'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: qCtrl, decoration: const InputDecoration(labelText: 'Question')),
            const SizedBox(height: 8),
            TextField(controller: aCtrl, decoration: const InputDecoration(labelText: 'Answer'), maxLines: 3),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (qCtrl.text.isEmpty || aCtrl.text.isEmpty) return;
              try {
                final newFaq = await Supabase.instance.client.from('business_faqs').insert({
                  'business_id': _businessId,
                  'question': qCtrl.text,
                  'answer': aCtrl.text
                }).select().single();
                setState(() => _faqs.add(newFaq));
                if (mounted) Navigator.pop(ctx);
              } catch(e) {
                debugPrint('Error adding FAQ: $e');
              }
            }, 
            child: const Text('Save')
          )
        ]
      )
    );
  }

  Future<void> _deleteFaq(String id) async {
    try {
      await Supabase.instance.client.from('business_faqs').delete().eq('id', id);
      setState(() => _faqs.removeWhere((f) => f['id'] == id));
    } catch(e) {
      debugPrint('Error deleting FAQ: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _businessId == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        actions: [
          IconButton(icon: const Icon(Icons.save), onPressed: _isSaving ? null : _saveProfile)
        ],
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Business Name')),
                const SizedBox(height: 16),
                TextField(controller: _cityCtrl, decoration: const InputDecoration(labelText: 'City')),
                const SizedBox(height: 16),
                TextField(controller: _whatsappCtrl, decoration: const InputDecoration(labelText: 'WhatsApp Number', hintText: 'e.g. +919876543210')),
                const SizedBox(height: 16),
                TextField(controller: _descCtrl, maxLines: 4, decoration: const InputDecoration(labelText: 'Description')),
                
                const SizedBox(height: 32),
                Text('Materials & Products', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                ..._editorGroups.map((g) => ExpansionTile(
                  title: Text('${g.group.icon ?? ''} ${g.group.name}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  children: g.items.map((i) => Column(
                    children: [
                      SwitchListTile(
                        title: Text(i.item.name),
                        value: i.selected,
                        onChanged: (val) => setState(() => i.selected = val)
                      ),
                      if (i.selected)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          child: TextFormField(
                            initialValue: i.customDesc,
                            decoration: const InputDecoration(hintText: 'Optional details (brands, specs)', border: OutlineInputBorder()),
                            onChanged: (val) => i.customDesc = val,
                          )
                        )
                    ]
                  )).toList(),
                )).toList(),
                
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Portfolio Images', style: Theme.of(context).textTheme.titleLarge),
                    TextButton.icon(onPressed: _uploadImage, icon: const Icon(Icons.add_a_photo), label: const Text('Upload')),
                  ],
                ),
                const SizedBox(height: 16),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: _images.length,
                  itemBuilder: (context, index) {
                    return Stack(
                      children: [
                        Positioned.fill(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CachedNetworkImage(
                              imageUrl: _images[index]['image_url'],
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        Positioned(
                          top: 4,
                          right: 4,
                          child: InkWell(
                            onTap: () => _deleteImage(_images[index]['id']),
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                              child: const Icon(Icons.delete, color: Colors.white, size: 16),
                            ),
                          ),
                        )
                      ],
                    );
                  }
                ),
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('FAQs', style: Theme.of(context).textTheme.titleLarge),
                    TextButton.icon(onPressed: _addFaq, icon: const Icon(Icons.add), label: const Text('Add FAQ')),
                  ],
                ),
                const SizedBox(height: 16),
                ..._faqs.map((faq) => Card(
                  elevation: 1,
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(faq['question'], style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(faq['answer']),
                    trailing: IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => _deleteFaq(faq['id'])),
                  )
                )).toList(),
                const SizedBox(height: 48),
              ],
            ),
          ),
          if (_isLoading || _isSaving)
            Container(color: Colors.black.withOpacity(0.1), child: const Center(child: CircularProgressIndicator())),
        ],
      )
    );
  }
}
