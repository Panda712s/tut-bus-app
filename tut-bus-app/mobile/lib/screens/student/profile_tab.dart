import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/user_models.dart';
import '../../services/student_repository.dart';
import '../../state/auth_state.dart';
import '../../l10n/app_l10n.dart';
import '../../widgets/state_views.dart';
import '../settings/settings_screen.dart';
import 'trip_history_screen.dart';
import 'feedback_screen.dart';
import 'edit_profile_screen.dart';

class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  final _repo = StudentRepository();
  StudentProfile? _profile;
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
                  backgroundColor: const Color(0xFF0A5796),
                  child: Text(
                    (_profile?.fullName.isNotEmpty ?? false) ? _profile!.fullName[0].toUpperCase() : '?',
                    style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 12),
                Center(
                  child: Text(_profile?.fullName ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                ),
                Center(
                  child: Text(_profile?.studentNumber ?? '', style: TextStyle(color: Color(0xFF8A90A2))),
                ),
                const SizedBox(height: 24),
                Card(
                  child: Column(
                    children: [
                      ListTile(leading: const Icon(Icons.email_outlined), title: Text(_profile?.email ?? '')),
                      ListTile(leading: const Icon(Icons.phone_outlined), title: Text(_profile?.phone ?? 'No phone number')),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.edit_outlined),
                        title: const Text('Edit profile'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => EditProfileScreen(profile: _profile)),
                          );
                          _load();
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.history_outlined),
                        title: const Text('Trip history'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TripHistoryScreen())),
                      ),
                      ListTile(
                        leading: const Icon(Icons.feedback_outlined),
                        title: const Text('Feedback & ratings'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const FeedbackScreen())),
                      ),
                      ListTile(
                        leading: const Icon(Icons.settings_outlined),
                        title: Text(AppL10n.of(context).t('common.settings')),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen())),
                      ),
                    ],
                  ),
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
