import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/transport_models.dart';
import '../../services/notifications_repository.dart';
import '../../services/socket_service.dart';
import '../../state/auth_state.dart';
import '../../widgets/state_views.dart';

class NotificationsTab extends StatefulWidget {
  const NotificationsTab({super.key});

  @override
  State<NotificationsTab> createState() => _NotificationsTabState();
}

class _NotificationsTabState extends State<NotificationsTab> {
  final _repo = NotificationsRepository();
  final _socket = NotificationsSocketService();
  List<AppNotification> _notifications = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
    _listenLive();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await _repo.fetchMine();
      setState(() => _notifications = items);
    } catch (_) {
      setState(() => _error = 'Could not load notifications.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _listenLive() {
    final user = context.read<AuthState>().user;
    if (user == null) return;
    _socket.connect(userId: user.id, role: 'STUDENT').then((_) {
      _socket.onNewNotification((_) => _load());
    });
  }

  @override
  void dispose() {
    _socket.dispose();
    super.dispose();
  }

  Future<void> _markRead(AppNotification n) async {
    if (n.read) return;
    setState(() {
      _notifications = _notifications
          .map((e) => e.recipientId == n.recipientId
              ? AppNotification(
                  recipientId: e.recipientId,
                  id: e.id,
                  title: e.title,
                  body: e.body,
                  type: e.type,
                  createdAt: e.createdAt,
                  read: true,
                )
              : e)
          .toList();
    });
    try {
      await _repo.markRead(n.recipientId);
    } catch (_) {
      // Non-fatal - local state already reflects "read"; a refresh will reconcile.
    }
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'DELAY_ALERT':
        return Icons.schedule_outlined;
      case 'BUS_ARRIVAL':
        return Icons.directions_bus_filled_rounded;
      case 'BUS_DEPARTURE':
        return Icons.exit_to_app_rounded;
      case 'ROUTE_CHANGE':
        return Icons.alt_route_rounded;
      case 'WEATHER_ALERT':
        return Icons.cloud_outlined;
      case 'EMERGENCY':
        return Icons.warning_amber_rounded;
      default:
        return Icons.notifications_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : _notifications.isEmpty
                  ? const EmptyView(message: 'No notifications yet.')
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        itemCount: _notifications.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final n = _notifications[index];
                          return ListTile(
                            leading: Icon(_iconFor(n.type), color: n.read ? Colors.black38 : const Color(0xFF1E63E0)),
                            title: Text(n.title, style: TextStyle(fontWeight: n.read ? FontWeight.normal : FontWeight.w700)),
                            subtitle: Text(n.body),
                            trailing: Text(DateFormat('MMM d, HH:mm').format(n.createdAt), style: const TextStyle(fontSize: 11, color: Colors.black45)),
                            onTap: () => _markRead(n),
                          );
                        },
                      ),
                    ),
    );
  }
}
