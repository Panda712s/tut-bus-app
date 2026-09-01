import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/user_models.dart';
import '../../services/driver_repository.dart';
import '../../state/auth_state.dart';
import '../../widgets/state_views.dart';
import 'driver_incident_screen.dart';

class DriverProfileTab extends StatefulWidget {
  const DriverProfileTab({super.key});

  @override
  State<DriverProfileTab> createState() => _DriverProfileTabState();
}

class _DriverProfileTabState extends State<DriverProfileTab> {
  final _repo = DriverRepository();
  DriverProfile? _profile;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final profile = await _repo.fetchMyProfile();
      setState(() => _profile = profile);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: _loading
          ? const LoadingView()
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: const Color(0xFF8B5CF6),
                  child: Text(
                    (_profile?.fullName.isNotEmpty ?? false) ? _profile!.fullName[0].toUpperCase() : '?',
                    style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 12),
                Center(child: Text(_profile?.fullName ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600))),
                Center(child: Text(_profile?.employeeNumber ?? '', style: const TextStyle(color: Colors.white70))),
                const SizedBox(height: 24),
                Card(
                  child: Column(
                    children: [
                      ListTile(leading: const Icon(Icons.email_outlined), title: Text(_profile?.email ?? '')),
                      ListTile(leading: const Icon(Icons.badge_outlined), title: Text('Status: ${_profile?.status ?? '—'}')),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: const Icon(Icons.report_problem_outlined),
                  title: const Text('Report an issue'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DriverIncidentScreen())),
                ),
                const SizedBox(height: 24),
                OutlinedButton.icon(
                  onPressed: () => context.read<AuthState>().signOut(),
                  icon: const Icon(Icons.logout, color: Colors.red),
                  label: const Text('Sign out', style: TextStyle(color: Colors.red)),
                ),
              ],
            ),
    );
  }
}
