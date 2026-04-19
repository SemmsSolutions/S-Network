import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();
  int _currentPage = 0;

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_seen_onboarding', true);
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          PageView(
            controller: _controller,
            onPageChanged: (idx) => setState(() => _currentPage = idx),
            children: [
              _buildSlide('Search Professionals', 'Find verified local contractors for your next critical project.', Icons.search),
              _buildSlide('View Portfolios', 'Browse high-quality galleries showcasing past success stories.', Icons.photo_library),
              _buildSlide('Get Quotes Fast', 'Direct message or call operators mapped instantly to your area.', Icons.request_quote),
            ],
          ),
          Positioned(
            bottom: 48,
            left: 24,
            right: 24,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(onPressed: _completeOnboarding, child: const Text('Skip')),
                Row(
                   children: List.generate(3, (idx) => Container(
                     margin: const EdgeInsets.symmetric(horizontal: 4),
                     width: _currentPage == idx ? 24 : 8,
                     height: 8,
                     decoration: BoxDecoration(
                        color: _currentPage == idx ? Theme.of(context).colorScheme.primary : Colors.grey,
                        borderRadius: BorderRadius.circular(4)
                     ),
                   ))
                ),
                ElevatedButton(
                  onPressed: () {
                     if (_currentPage == 2) {
                        _completeOnboarding();
                     } else {
                        _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeIn);
                     }
                  }, 
                  child: Text(_currentPage == 2 ? 'Get Started' : 'Next')
                )
              ]
            )
          )
        ]
      )
    );
  }

  Widget _buildSlide(String title, String desc, IconData icon) {
    return Padding(
      padding: const EdgeInsets.all(48.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
           Icon(icon, size: 100, color: Colors.blueGrey[800]), // Simplified color mapping
           const SizedBox(height: 32),
           Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
           const SizedBox(height: 16),
           Text(desc, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, color: Colors.grey)),
        ]
      )
    );
  }
}
