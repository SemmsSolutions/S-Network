import 'package:flutter/material.dart';

class VerificationBadgeWidget extends StatelessWidget {
  final String status;
  final double fontSize;
  final double padding;

  const VerificationBadgeWidget({
    super.key,
    required this.status,
    this.fontSize = 10,
    this.padding = 4,
  });

  factory VerificationBadgeWidget.small({Key? key, required String status}) {
    return VerificationBadgeWidget(key: key, status: status, fontSize: 10, padding: 4);
  }

  factory VerificationBadgeWidget.medium({Key? key, required String status}) {
    return VerificationBadgeWidget(key: key, status: status, fontSize: 12, padding: 6);
  }

  @override
  Widget build(BuildContext context) {
    if (status != 'verified' && status != 'approved') return const SizedBox.shrink();

    return Container(
      padding: EdgeInsets.symmetric(horizontal: padding * 2, vertical: padding),
      decoration: BoxDecoration(
        color: const Color(0xFF2ECC71),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check, color: Colors.white, size: fontSize + 2),
          const SizedBox(width: 4),
          Text(
            'Verified',
            style: TextStyle(color: Colors.white, fontSize: fontSize, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
