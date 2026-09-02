import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/transport_models.dart';
import '../../services/notifications_repository.dart';
import '../../services/socket_service.dart';
import '../../state/auth_state.dart';
import '../../widgets/state_views.dart';
import '../../widgets/tut_background.dart';

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
      if (!mounted) return;
      setState(() => _notifications = items);
    } catch (e) {
      if (mounted) setState(() => _error = 'Could not load notifications.\n$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _listenLive() {
    try {
      final user = context.read<AuthState>().user;
      if (user == null) return;
      _socket.connect(userId: user.id, role: 'STUDENT').then((_) {
        _socket.onNewNotification((_) => _load());
      }).catchError((_) {});
    } catch (_) {
      // A live-feed failure must never break the screen.
    }
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
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: TutBackground(
        child: _loading
            ? const LoadingView()
            : _error != null
                ? ErrorView(message: _error!, onRetry: _load)
                : _notifications.isEmpty
                    ? const EmptyView(message: 'No notifications yet.')
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                          itemCount: _notifications.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final n = _notifications[index];
                            return Container(
                              decoration: BoxDecoration(
                                color: theme.cardColor,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: n.read ? theme.dividerColor : const Color(0x330A5796),
                                ),
                              ),
                              child: ListTile(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                leading: Container(
                                  height: 38,
                                  width: 38,
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: const Color(0x1F0A5796),
                                    borderRadius: BorderRadius.circular(11),
                                  ),
                                  child: Icon(_iconFor(n.type),
                                      size: 20,
                                      color: n.read ? const Color(0xFF8A90A2) : const Color(0xFF0A5796)),
                                ),
                                title: Text(n.title,
                                    style: TextStyle(fontWeight: n.read ? FontWeight.w500 : FontWeight.w700)),
                                subtitle: Text(n.body, maxLines: 2, overflow: TextOverflow.ellipsis),
                                trailing: Text(
                                  DateFormat('MMM d, HH:mm').format(n.createdAt),
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF8A90A2)),
                                ),
                                onTap: () => _markRead(n),
                              ),
                            );
                          },
                        ),
                      ),
      ),
    );
  }
}
