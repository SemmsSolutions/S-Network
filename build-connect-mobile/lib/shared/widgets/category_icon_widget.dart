import 'package:flutter/material.dart';

/// Displays a construction category icon using Material Icons with
/// category-specific colors. No external asset dependencies.
class CategoryIconWidget extends StatelessWidget {
  final String slug;
  final double size;

  const CategoryIconWidget({
    super.key,
    required this.slug,
    this.size = 56,
  });

  @override
  Widget build(BuildContext context) {
    final data = _iconData[slug] ?? _iconData['default']!;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Color(data['bg'] as int),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Center(
        child: Icon(
          data['icon'] as IconData,
          color: Color(data['color'] as int),
          size: size * 0.5,
        ),
      ),
    );
  }

  static final Map<String, Map<String, dynamic>> _iconData = {
    'architect': {
      'bg': 0xFFDCFCE7,
      'color': 0xFF16A34A,
      'icon': Icons.architecture,
    },
    'civil-contractor': {
      'bg': 0xFFFEE2E2,
      'color': 0xFFCC0000,
      'icon': Icons.home_work,
    },
    'commercial-contractor': {
      'bg': 0xFFEDE9FE,
      'color': 0xFF7C3AED,
      'icon': Icons.business,
    },
    'turnkey-contractor': {
      'bg': 0xFFFEF3C7,
      'color': 0xFFD97706,
      'icon': Icons.vpn_key,
    },
    'interior-designer': {
      'bg': 0xFFFCE7F3,
      'color': 0xFFDB2777,
      'icon': Icons.design_services,
    },
    'electrician': {
      'bg': 0xFFFEF9C3,
      'color': 0xFFCA8A04,
      'icon': Icons.electric_bolt,
    },
    'plumber': {
      'bg': 0xFFE0F2FE,
      'color': 0xFF0284C7,
      'icon': Icons.plumbing,
    },
    'plumber-waterproofing': {
      'bg': 0xFFE0F2FE,
      'color': 0xFF0284C7,
      'icon': Icons.plumbing,
    },
    'residential-builder': {
      'bg': 0xFFDBEAFE,
      'color': 0xFF1D4ED8,
      'icon': Icons.house,
    },
    'material-supplier': {
      'bg': 0xFFF0FDF4,
      'color': 0xFF15803D,
      'icon': Icons.inventory_2,
    },
    'default': {
      'bg': 0xFFF3F4F6,
      'color': 0xFF6B7280,
      'icon': Icons.construction,
    },
  };
}
