import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/compare_service.dart';

class BusinessCardWidget extends ConsumerWidget {
  final Map<String, dynamic> business;

  const BusinessCardWidget({super.key, required this.business});

  bool _isOpenNow() {
    final hr = DateTime.now().hour;
    return hr >= 9 && hr < 18;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String name = business['name'] ?? 'Unknown Business';
    final String category = business['categories']?['name'] ?? 'Contractor';
    final double rating = (business['rating'] ?? 0).toDouble();
    final int reviews = business['total_reviews'] ?? 0;
    final bool isVerified = business['is_verified'] == true;
    final String city = business['city'] ?? 'Unknown City';
    
    // MVP representation of the first portfolio image logic
    final String? imageUrl = (business['business_images'] != null && (business['business_images'] as List).isNotEmpty) 
      ? business['business_images'][0]['image_url'] 
      : null;

    final bool isOpen = _isOpenNow();
    final compareList = ref.watch(compareProvider);
    final isCompared = compareList.any((b) => b['id'] == business['id']);

    return GestureDetector(
      onTap: () => context.push('/business/${business['id']}'),
      onLongPress: () {
        ref.read(compareProvider.notifier).toggleCompare(business);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isCompared ? 'Removed from compare' : 'Added to compare'),
            duration: const Duration(seconds: 1),
            behavior: SnackBarBehavior.floating,
          ),
        );
      },
      child: Card(
        clipBehavior: Clip.antiAlias,
        elevation: isCompared ? 6 : 2,
        shape: RoundedRectangleBorder(
           borderRadius: BorderRadius.circular(12),
           side: isCompared ? BorderSide(color: Theme.of(context).colorScheme.primary, width: 2) : BorderSide.none,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail Header
            Stack(
              children: [
                SizedBox(
                  height: 140,
                  width: double.infinity,
                  child: imageUrl != null && imageUrl.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: imageUrl,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                          errorWidget: (context, url, error) => Container(color: Colors.grey[200], child: const Icon(Icons.business, size: 40, color: Colors.grey)),
                        )
                      : Container(color: Colors.grey[200], child: const Icon(Icons.image, size: 40, color: Colors.grey)),
                ),
                if (isVerified)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(4)),
                      child: const Text('Verified', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ),
              ],
            ),
            // Interactive Details
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(category.toUpperCase(), style: TextStyle(color: Theme.of(context).colorScheme.primary, fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: isOpen ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(isOpen ? 'OPEN' : 'CLOSED', style: TextStyle(color: isOpen ? Colors.green[700] : Colors.red[700], fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                      ]
                    ),
                    const SizedBox(height: 6),
                    Text(name, style: Theme.of(context).textTheme.titleSmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                    const Spacer(),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.orange, size: 14),
                        const SizedBox(width: 4),
                        Text('$rating', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        const SizedBox(width: 4),
                        Expanded(child: Text('($reviews)', style: const TextStyle(color: Colors.grey, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.location_on, color: Colors.grey, size: 12),
                        const SizedBox(width: 4),
                        Expanded(child: Text(city, style: const TextStyle(color: Colors.grey, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
