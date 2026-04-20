import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    final data = await Supabase.instance.client
        .from('notifications')
        .select()
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .limit(50);

    setState(() {
      _notifications = data;
      _loading = false;
    });
  }

  Future<void> _markAllRead() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    await Supabase.instance.client
        .from('notifications')
        .update({'is_read': true})
        .eq('user_id', userId)
        .eq('is_read', false);

    _loadNotifications();
  }

  IconData _iconForType(String? type) {
    switch (type) {
      case 'lead_update': return Icons.inbox;
      case 'review': return Icons.star;
      case 'verification': return Icons.verified;
      case 'message': return Icons.chat;
      default: return Icons.notifications;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: _markAllRead,
            child: const Text('Mark all read', style: TextStyle(color: Colors.white70)),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_none, size: 64, color: Color(0xFFC0C8D8)),
                      SizedBox(height: 16),
                      Text('No notifications yet', style: TextStyle(color: Color(0xFF6B7A99), fontSize: 16)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  child: ListView.builder(
                    itemCount: _notifications.length,
                    itemBuilder: (context, index) {
                      final n = _notifications[index];
                      final isRead = n['is_read'] == true;

                      return Container(
                        color: isRead ? null : const Color(0xFFCC0000).withValues(alpha: 0.04),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isRead ? const Color(0xFFF5F6FA) : const Color(0xFFFEE2E2),
                            child: Icon(_iconForType(n['type']), color: isRead ? const Color(0xFF6B7A99) : const Color(0xFFCC0000), size: 20),
                          ),
                          title: Text(n['title'] ?? '', style: TextStyle(fontWeight: isRead ? FontWeight.w400 : FontWeight.w600)),
                          subtitle: Text(n['body'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis),
                          trailing: Text(_timeAgo(n['created_at']), style: const TextStyle(fontSize: 11, color: Color(0xFF6B7A99))),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  String _timeAgo(String? dateStr) {
    if (dateStr == null) return '';
    final date = DateTime.tryParse(dateStr);
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
