import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../shared/models/material_model.dart';

final materialServiceProvider = Provider((ref) => MaterialService());

class MaterialService {
  final _client = Supabase.instance.client;

  Future<List<MaterialGroup>> getMaterialGroups() async {
    final response = await _client.from('material_category_groups').select().order('sort_order');
    return (response as List).map((e) => MaterialGroup.fromJson(e)).toList();
  }

  Future<List<MaterialItem>> getMaterialItems(String groupId) async {
    final response = await _client.from('material_items').select().eq('group_id', groupId).order('sort_order');
    return (response as List).map((e) => MaterialItem.fromJson(e)).toList();
  }

  Future<List<BusinessMaterial>> getBusinessMaterials(String businessId) async {
    final response = await _client
        .from('business_materials')
        .select('*, material_items(*)')
        .eq('business_id', businessId);
    return (response as List).map((e) => BusinessMaterial.fromJson(e)).toList();
  }

  Future<void> updateBusinessMaterials(String businessId, List<Map<String, dynamic>> selections) async {
    // Delete existing
    await _client.from('business_materials').delete().eq('business_id', businessId);
    
    if (selections.isNotEmpty) {
      // Insert new
      final inserts = selections.map((s) => {
        'business_id': businessId,
        'material_item_id': s['itemId'],
        'custom_description': s['desc'] ?? '',
      }).toList();
      await _client.from('business_materials').insert(inserts);
    }
  }
}
