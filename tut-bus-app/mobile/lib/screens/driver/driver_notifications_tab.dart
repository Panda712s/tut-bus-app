import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/transport_models.dart';
import '../../services/notifications_repository.dart';
import '../../services/socket_service.dart';
import '../../state/auth_state.dart';
import '../../widgets/state_views.dart';

class DriverNotificationsTab extends StatefulWidget {
  const DriverNotificationsTab({super.key});

  @override
  State<DriverNotificationsTab> createState() => _DriverNotificationsTabState();
}

class _DriverNotificationsTabState extends State<DriverNotificationsTab> {
  final _repo = NotificationsRepository();
  final _socket = NotificationsSocketService();
  List<AppNotification> _notifications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
    final user = context.read<AuthState>().user;
    if (user != null) {
      _socket.connect(userId: user.id, role: 'DRIVER').then((_) {
        _socket.onNewNotification((_) => _load());
      });
    }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final items = await _repo.fetchMine();
      setState(() => _notifications = items);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _socket.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: _loading
          ? const LoadingView()
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
                        leading: Icon(Icons.notifications_outlined, color: n.read ? Colors.white54 : const Color(0xFF8B5CF6)),
                        title: Text(n.title, style: TextStyle(fontWeight: n.read ? FontWeight.normal : FontWeight.w700)),
                        subtitle: Text(n.body),
                        trailing: Text(DateFormat('MMM d, HH:mm').format(n.createdAt), style: const TextStyle(fontSize: 11)),
                        onTap: () => _repo.markRead(n.recipientId).then((_) => _load()),
                      );
                    },
                  ),
                ),
    );
  }
}
