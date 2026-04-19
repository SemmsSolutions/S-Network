import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/compare_service.dart';

class CompareScreen extends ConsumerWidget {
  const CompareScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final compareList = ref.watch(compareProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Compare Businesses'),
        actions: [
          if (compareList.isNotEmpty)
            TextButton(
              onPressed: () => ref.read(compareProvider.notifier).clear(),
              child: const Text('Clear', style: TextStyle(color: Colors.white)),
            )
        ],
      ),
      body: compareList.isEmpty 
        ? const Center(child: Text('No businesses selected for comparison. Long-press business cards to add them.'))
        : SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              columns: [
                const DataColumn(label: Text('Feature', style: TextStyle(fontWeight: FontWeight.bold))),
                ...compareList.map((b) => DataColumn(label: Text(b['name'], style: const TextStyle(fontWeight: FontWeight.bold)))),
              ],
              rows: [
                DataRow(cells: [
                  const DataCell(Text('Category')),
                  ...compareList.map((b) => DataCell(Text(b['categories']?['name'] ?? ''))),
                ]),
                DataRow(cells: [
                  const DataCell(Text('Rating')),
                  ...compareList.map((b) => DataCell(Row(children: [const Icon(Icons.star, color: Colors.orange, size: 16), Text(' ${b['rating']}')]))),
                ]),
                DataRow(cells: [
                  const DataCell(Text('Verified')),
                  ...compareList.map((b) => DataCell(Icon(b['is_verified'] == true ? Icons.check_circle : Icons.cancel, color: b['is_verified'] == true ? Colors.green : Colors.red))),
                ]),
                DataRow(cells: [
                  const DataCell(Text('Response Rate')),
                  ...compareList.map((b) => DataCell(Text('${b['response_rate'] ?? 0}%'))),
                ]),
                DataRow(cells: [
                  const DataCell(Text('Services')),
                  ...compareList.map((b) => DataCell(Text((b['service_areas'] as List?)?.join(', ') ?? 'N/A'))),
                ]),
              ],
            ),
          )
    );
  }
}
