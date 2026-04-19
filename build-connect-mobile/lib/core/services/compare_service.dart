import 'package:flutter_riverpod/flutter_riverpod.dart';

class CompareNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  CompareNotifier() : super([]);

  void toggleCompare(Map<String, dynamic> business) {
    if (state.any((b) => b['id'] == business['id'])) {
      state = state.where((b) => b['id'] != business['id']).toList();
    } else {
      if (state.length < 3) {
        state = [...state, business];
      }
    }
  }

  void clear() {
    state = [];
  }
}

final compareProvider = StateNotifierProvider<CompareNotifier, List<Map<String, dynamic>>>((ref) {
  return CompareNotifier();
});
