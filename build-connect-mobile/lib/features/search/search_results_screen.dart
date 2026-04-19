import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../shared/widgets/business_card_widget.dart';
import '../../core/services/material_service.dart';
import '../../shared/models/material_model.dart';

class SearchResultsScreen extends StatefulWidget {
  final String? initialQuery;
  final String? initialCategory;

  const SearchResultsScreen({super.key, this.initialQuery, this.initialCategory});

  @override
  State<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends State<SearchResultsScreen> {
  List<Map<String, dynamic>> _businesses = [];
  bool _isLoading = true;
  
  String? _query;
  String? _category;
  String? _city;
  String? _materialGroupId;
  bool _verifiedOnly = false;
  List<MaterialGroup> _materialGroups = [];

  @override
  void initState() {
    super.initState();
    _query = widget.initialQuery;
    _category = widget.initialCategory;
    _loadMaterials();
    _fetchResults();
  }

  Future<void> _loadMaterials() async {
    final materialService = MaterialService();
    final groups = await materialService.getMaterialGroups();
    if (mounted) setState(() => _materialGroups = groups);
  }

  Future<void> _fetchResults() async {
    setState(() => _isLoading = true);
    try {
      final res = await Supabase.instance.client.functions.invoke('search-businesses', body: {
        'query': _query,
        'category_id': null,
        'city': _city,
        if (_materialGroupId != null) 'material_group_id': _materialGroupId,
      });

      if (res.data != null && res.data['data'] != null) {
        var results = List<Map<String, dynamic>>.from(res.data['data']);
        if (_category != null) {
           results = results.where((b) => b['categories']?['slug'] == _category).toList();
        }
        if (_verifiedOnly) {
          results = results.where((b) => b['is_verified'] == true).toList();
        }
        setState(() => _businesses = results);
      }
    } catch(e) {
      debugPrint('Search error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return FilterSheet(
          city: _city,
          category: _category,
          materialGroupId: _materialGroupId,
          materialGroups: _materialGroups,
          verifiedOnly: _verifiedOnly,
          onApply: (city, cat, materialId, verified) {
            setState(() {
              _city = city;
              _category = cat;
              _materialGroupId = materialId;
              _verifiedOnly = verified;
            });
            _fetchResults();
          },
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Results'),
        actions: [
          IconButton(icon: const Icon(Icons.filter_list), onPressed: _showFilterSheet),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _businesses.isEmpty
              ? const Center(child: Text('No results found.', style: TextStyle(fontWeight: FontWeight.bold)))
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 0.70,
                  ),
                  itemCount: _businesses.length,
                  itemBuilder: (context, index) {
                    return BusinessCardWidget(business: _businesses[index]);
                  },
                ),
    );
  }
}

class FilterSheet extends StatefulWidget {
  final String? city;
  final String? category;
  final String? materialGroupId;
  final List<MaterialGroup> materialGroups;
  final bool verifiedOnly;
  final Function(String?, String?, String?, bool) onApply;

  const FilterSheet({super.key, this.city, this.category, this.materialGroupId, required this.materialGroups, required this.verifiedOnly, required this.onApply});

  @override
  State<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<FilterSheet> {
  late TextEditingController _cityCtrl;
  String? _cat;
  String? _matGroupId;
  late bool _verified;

  @override
  void initState() {
    super.initState();
    _cityCtrl = TextEditingController(text: widget.city);
    _cat = widget.category;
    _matGroupId = widget.materialGroupId;
    _verified = widget.verifiedOnly;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Filters', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 24),
          TextField(controller: _cityCtrl, decoration: const InputDecoration(labelText: 'City', prefixIcon: Icon(Icons.location_city))),
          const SizedBox(height: 16),
          TextField(
            decoration: const InputDecoration(labelText: 'Category Slug (e.g. architect)', prefixIcon: Icon(Icons.category)),
            onChanged: (val) => _cat = val,
            controller: TextEditingController(text: _cat),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String?>(
            value: _matGroupId,
            decoration: const InputDecoration(labelText: 'Material Category', border: OutlineInputBorder()),
            items: [
              const DropdownMenuItem(value: null, child: Text('Any Material')),
              ...widget.materialGroups.map((g) => DropdownMenuItem(value: g.id, child: Text('${g.icon ?? ''} ${g.name}'))).toList()
            ],
            onChanged: (val) => setState(() => _matGroupId = val),
          ),
          const SizedBox(height: 16),
          SwitchListTile(
            title: const Text('Verified Professionals Only', style: TextStyle(fontWeight: FontWeight.bold)),
            value: _verified,
            activeColor: Theme.of(context).colorScheme.primary,
            contentPadding: EdgeInsets.zero,
            onChanged: (val) => setState(() => _verified = val),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              widget.onApply(_cityCtrl.text.isNotEmpty ? _cityCtrl.text : null, _cat?.isNotEmpty == true ? _cat : null, _matGroupId, _verified);
            },
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            child: const Text('Apply Filters'),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
