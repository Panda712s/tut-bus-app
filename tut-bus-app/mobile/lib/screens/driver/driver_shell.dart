import 'package:flutter/material.dart';
import '../../l10n/app_l10n.dart';
import 'driver_home_tab.dart';
import 'driver_notifications_tab.dart';
import 'driver_profile_tab.dart';

class DriverShell extends StatefulWidget {
  const DriverShell({super.key});

  @override
  State<DriverShell> createState() => _DriverShellState();
}

class _DriverShellState extends State<DriverShell> {
  int _index = 0;

  final _tabs = const [
    DriverHomeTab(),
    DriverNotificationsTab(),
    DriverProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          NavigationDestination(
              icon: const Icon(Icons.dashboard_outlined),
              selectedIcon: const Icon(Icons.dashboard),
              label: AppL10n.of(context).t('nav.trip')),
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
