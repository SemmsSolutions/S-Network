import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class AdminRedirectScreen extends StatelessWidget {
  const AdminRedirectScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin Panel')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.admin_panel_settings, size: 72, color: Color(0xFFCC0000)),
              const SizedBox(height: 24),
              const Text(
                'Admin Panel',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Color(0xFF0A1628)),
              ),
              const SizedBox(height: 12),
              const Text(
                'The admin panel is only available on the web version of S-Network.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFF6B7A99), fontSize: 15),
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: () async {
                  final url = Uri.parse('https://snetwork.in/admin');
                  if (await canLaunchUrl(url)) {
                    await launchUrl(url, mode: LaunchMode.externalApplication);
                  }
                },
                icon: const Icon(Icons.open_in_browser),
                label: const Text('Open Admin Panel in Browser'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
