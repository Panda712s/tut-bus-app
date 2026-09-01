import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../l10n/app_l10n.dart';
import '../../state/auth_state.dart';
import '../../services/socket_service.dart';
import '../../widgets/sos_button.dart';
import 'home_tab.dart';
import 'live_map_tab.dart';
import 'routes_tab.dart';
import 'notifications_tab.dart';
import 'profile_tab.dart';

class StudentShell extends StatefulWidget {
  const StudentShell({super.key});

  @override
  State<StudentShell> createState() => _StudentShellState();
}

class _StudentShellState extends State<StudentShell> {
  int _index = 0;
  final _notifications = NotificationsSocketService();

  final _tabs = const [
    HomeTab(),
    LiveMapTab(),
    RoutesTab(),
    NotificationsTab(),
    ProfileTab(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _connectArrivalFeed());
  }

  Future<void> _connectArrivalFeed() async {
    final user = context.read<AuthState>().user;
    if (user == null) return;
    await _notifications.connect(userId: user.id, role: 'STUDENT');
    _notifications.onStopArrival((data) {
      if (!mounted) return;
      final bus = data['busNumber'] ?? 'A bus';
      final stop = data['stopName'] ?? 'a stop';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$bus is arriving at $stop'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    });
  }

  @override
  void dispose() {
    _notifications.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          IndexedStack(index: _index, children: _tabs),
          Positioned(right: 16, bottom: 16, child: SafeArea(child: SosButton(compact: true))),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          NavigationDestination(
              icon: const Icon(Icons.home_outlined),
              selectedIcon: const Icon(Icons.home),
              label: AppL10n.of(context).t('nav.home')),
          NavigationDestination(
              icon: const Icon(Icons.map_outlined),
              selectedIcon: const Icon(Icons.map),
              label: AppL10n.of(context).t('nav.map')),
          NavigationDestination(
              icon: const Icon(Icons.alt_route_outlined),
              selectedIcon: const Icon(Icons.alt_route),
              label: AppL10n.of(context).t('nav.routes')),
          NavigationDestination(
              icon: const Icon(Icons.notifications_outlined),
              selectedIcon: const Icon(Icons.notifications),
              label: AppL10n.of(context).t('nav.alerts')),
          NavigationDestination(
              icon: const Icon(Icons.person_outline),
              selectedIcon: const Icon(Icons.person),
              label: AppL10n.of(context).t('nav.profile')),
        ],
      ),
    );
  }
}
