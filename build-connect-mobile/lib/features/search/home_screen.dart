import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/recently_viewed_service.dart';
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

  @override
  void initState() {
    super.initState();
    _fetchNearby();
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
