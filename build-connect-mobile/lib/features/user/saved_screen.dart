import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SavedScreen extends StatefulWidget {
  const SavedScreen({super.key});

  @override
  State<SavedScreen> createState() => _SavedScreenState();
}

class _SavedScreenState extends State<SavedScreen> {
  List<dynamic> _saved = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSaved();
  }

  Future<void> _loadSaved() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    final data = await Supabase.instance.client
        .from('saved_businesses')
        .select('*, businesses(id, name, city, rating, cover_image_url, categories(name))')
        .eq('user_id', userId)
        .order('created_at', ascending: false);

    setState(() {
      _saved = data;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Saved Businesses')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _saved.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.bookmark_border, size: 64, color: Color(0xFFC0C8D8)),
                      SizedBox(height: 16),
                      Text('No saved businesses yet', style: TextStyle(color: Color(0xFF6B7A99), fontSize: 16)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadSaved,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _saved.length,
                    itemBuilder: (context, index) {
                      final item = _saved[index];
                      final biz = item['businesses'];
                      if (biz == null) return const SizedBox.shrink();

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: biz['cover_image_url'] != null
                                ? Image.network(biz['cover_image_url'], width: 56, height: 56, fit: BoxFit.cover)
                                : Container(width: 56, height: 56, color: const Color(0xFFF5F6FA),
                                    child: const Icon(Icons.business, color: Color(0xFFC0C8D8))),
                          ),
                          title: Text(biz['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text('${biz['categories']?['name'] ?? ''} • ${biz['city'] ?? ''}'),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star, size: 16, color: Color(0xFFD97706)),
                              Text(' ${biz['rating']?.toStringAsFixed(1) ?? '0.0'}'),
                            ],
                          ),
                          onTap: () {
                            // Navigate to business profile
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
