import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class RecentlyViewedNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  RecentlyViewedNotifier() : super([]) {
    _loadHistory();
  }

  static const _key = 'recently_viewed_businesses';

  Future<void> _loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getStringList(_key) ?? [];
    try {
      state = data.map((item) => jsonDecode(item) as Map<String, dynamic>).toList();
    } catch (e) {
      state = [];
    }
  }

  Future<void> addBusiness(Map<String, dynamic> business) async {
    var current = [...state];
    current.removeWhere((b) => b['id'] == business['id']);
    current.insert(0, business);
    
    if (current.length > 5) {
      current = current.sublist(0, 5);
    }
    
    state = current;
    final prefs = await SharedPreferences.getInstance();
    final jsonList = state.map((b) => jsonEncode({
       'id': b['id'],
       'name': b['name'],
       'city': b['city'],
       'categoryId': b['category_id'] ?? b['categories']?['id'],
       'rating': b['rating'],
       'isVerified': b['is_verified']
    })).toList();
    await prefs.setStringList(_key, jsonList);
  }
}

final recentlyViewedProvider = StateNotifierProvider<RecentlyViewedNotifier, List<Map<String, dynamic>>>((ref) {
  return RecentlyViewedNotifier();
});
