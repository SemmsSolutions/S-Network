import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/recently_viewed_service.dart';
import 'dart:async';
import '../../shared/widgets/business_card_widget.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchCtrl = TextEditingController();
  List<Map<String, dynamic>> _nearbyBusinesses = [];
  bool _isLoading = true;

  final List<Map<String, String>> categories = [
    {'name': 'Near Me', 'slug': 'near-me', 'icon': '📍'},
    {'name': 'Civil Contractor', 'slug': 'civil-contractor', 'icon': '👷'},
    {'name': 'Residential Builder', 'slug': 'residential-builder', 'icon': '🏠'},
    {'name': 'Commercial Contractor', 'slug': 'commercial-contractor', 'icon': '🏢'},
    {'name': 'Turnkey Contractor', 'slug': 'turnkey-contractor', 'icon': '🔑'},
    {'name': 'Architect', 'slug': 'architect', 'icon': '📐'},
    {'name': 'Interior Designer', 'slug': 'interior-designer', 'icon': '🎨'},
    {'name': 'Electrician', 'slug': 'electrician', 'icon': '⚡'},
    {'name': 'Plumber / Waterproofing', 'slug': 'plumber-waterproofing', 'icon': '🔧'},
    {'name': 'Material Supplier', 'slug': 'material-supplier', 'icon': '🧱'},
  ];

  final PageController _pageController = PageController();
  int _currentBannerIndex = 0;
  Timer? _timer;

  final List<Map<String, String>> bannerSlides = [
    { 'title': 'Build Your Dream Home', 'subtitle': 'Connect with verified contractors across India', 'image': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80' },
    { 'title': 'Trusted Architects Near You', 'subtitle': 'Licensed professionals with proven portfolios', 'image': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80' },
    { 'title': 'Interior Design Services', 'subtitle': 'Transform your space with expert designers', 'image': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80' },
  ];

  @override
  void initState() {
    super.initState();
    _fetchNearby();
    _timer = Timer.periodic(const Duration(seconds: 4), (Timer timer) {
      if (_currentBannerIndex < bannerSlides.length - 1) {
        _currentBannerIndex++;
      } else {
        _currentBannerIndex = 0;
      }
      
      if (_pageController.hasClients) {
        _pageController.animateToPage(
          _currentBannerIndex,
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeIn,
        );
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchNearby() async {
    setState(() => _isLoading = true);
    
    Position? position;
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      LocationPermission permission = await Geolocator.checkPermission();
      
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      
      if (serviceEnabled && (permission == LocationPermission.whileInUse || permission == LocationPermission.always)) {
        position = await Geolocator.getCurrentPosition();
      }
    } catch(e) {
      debugPrint('Location error: $e');
    }

    try {
      final res = await Supabase.instance.client.functions.invoke('search-businesses', body: {
        'lat': position?.latitude,
        'lng': position?.longitude,
      });

      if (res.data != null && res.data['data'] != null) {
        setState(() {
          _nearbyBusinesses = List<Map<String, dynamic>>.from(res.data['data']);
        });
      }
    } catch(e) {
      debugPrint('Error fetching businesses: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _onSearchSubmit() {
    if (_searchCtrl.text.isNotEmpty) {
      context.push('/search?query=${_searchCtrl.text}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final recentlyViewed = ref.watch(recentlyViewedProvider);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 220.0,
            floating: false,
            pinned: true,
            automaticallyImplyLeading: false,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                color: Theme.of(context).colorScheme.secondary,
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Find. Verify. Build.', style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: Colors.white)),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _searchCtrl,
                      onSubmitted: (_) => _onSearchSubmit(),
                      textInputAction: TextInputAction.search,
                      decoration: InputDecoration(
                        hintText: 'What service do you need?',
                        hintStyle: const TextStyle(color: Colors.grey),
                        prefixIcon: const Icon(Icons.search, color: Colors.grey),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        filled: true,
                        fillColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 200,
              child: Stack(
                children: [
                  PageView.builder(
                    controller: _pageController,
                    onPageChanged: (int index) {
                      setState(() => _currentBannerIndex = index);
                    },
                    itemCount: bannerSlides.length,
                    itemBuilder: (context, index) {
                      final slide = bannerSlides[index];
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          image: DecorationImage(
                            image: NetworkImage(slide['image']!),
                            fit: BoxFit.cover,
                          ),
                          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4))],
                        ),
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            gradient: LinearGradient(
                              begin: Alignment.bottomLeft,
                              end: Alignment.topRight,
                              colors: [Colors.black.withOpacity(0.8), Colors.transparent],
                            ),
                          ),
                          padding: const EdgeInsets.all(20),
                          alignment: Alignment.bottomLeft,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(slide['title']!, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text(slide['subtitle']!, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  Positioned(
                    bottom: 24,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: bannerSlides.asMap().entries.map((entry) {
                        return Container(
                          width: _currentBannerIndex == entry.key ? 24.0 : 8.0,
                          height: 8.0,
                          margin: const EdgeInsets.symmetric(horizontal: 4.0),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(4),
                            color: _currentBannerIndex == entry.key ? Colors.white : Colors.white.withOpacity(0.5),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Text('Categories', style: Theme.of(context).textTheme.titleLarge),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 100,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: categories.length,
                      itemBuilder: (context, index) {
                        final cat = categories[index];
                        return GestureDetector(
                          onTap: () {
                             if (cat['slug'] == 'near-me') {
                               context.push('/search?near_me=true');
                             } else {
                               context.push('/search?category=${cat['slug']}');
                             }
                          },
                          child: Container(
                            width: 80,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            child: Column(
                              children: [
                                CircleAvatar(
                                  backgroundColor: Colors.white,
                                  radius: 30,
                                  child: Text(cat['icon']!, style: const TextStyle(fontSize: 24)),
                                ),
                                const SizedBox(height: 8),
                                Text(cat['name']!, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold), textAlign: TextAlign.center, maxLines: 2),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (recentlyViewed.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Text('Recently Viewed', style: Theme.of(context).textTheme.titleLarge),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 240,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: recentlyViewed.length,
                        itemBuilder: (context, index) {
                          return Container(
                            width: 180,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            child: BusinessCardWidget(business: recentlyViewed[index]),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverToBoxAdapter(
              child: Text('Nearby Professionals', style: Theme.of(context).textTheme.titleLarge),
            ),
          ),
          if (_isLoading)
            const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator()))
          else if (_nearbyBusinesses.isEmpty)
            const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.all(24), child: Center(child: Text('No businesses found nearby.'))))
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 0.70,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) => BusinessCardWidget(business: _nearbyBusinesses[index]),
                  childCount: _nearbyBusinesses.length,
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 48)),
        ],
      ),
    );
  }
}
