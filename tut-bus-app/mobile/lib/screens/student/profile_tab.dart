import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/user_models.dart';
import '../../services/student_repository.dart';
import '../../state/auth_state.dart';
import '../../l10n/app_l10n.dart';
import '../../widgets/state_views.dart';
import '../../widgets/person_avatar.dart';
import '../../widgets/tut_background.dart';
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
    final l = AppL10n.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: TutBackground(
        child: _loading
            ? const LoadingView()
            : ListView(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                children: [
                  const SizedBox(height: 8),
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0x330A5796), width: 2),
                      ),
                      child: PersonAvatar(
                        imageUrl: _profile?.profileImageUrl,
                        name: _profile?.fullName ?? '',
                        radius: 38,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Center(
                    child: Text(
                      _profile?.fullName ?? '',
                      style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700, letterSpacing: -0.2),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Center(
                    child: Text(
                      _profile?.studentNumber ?? '',
                      style: const TextStyle(color: Color(0xFF8A90A2), fontSize: 13),
                    ),
                  ),
                  const SizedBox(height: 28),
                  const _GroupLabel('Account'),
                  _CardGroup(
                    children: [
                      _InfoRow(icon: Icons.email_outlined, value: _profile?.email ?? '—'),
                      _InfoRow(icon: Icons.phone_outlined, value: _profile?.phone ?? 'No phone number'),
                    ],
                  ),
                  const SizedBox(height: 22),
                  const _GroupLabel('Manage'),
                  _CardGroup(
                    children: [
                      _NavRow(
                        icon: Icons.edit_outlined,
                        label: 'Edit profile',
                        onTap: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => EditProfileScreen(profile: _profile)),
                          );
                          _load();
                        },
                      ),
                      _NavRow(
                        icon: Icons.history_outlined,
                        label: 'Trip history',
                        onTap: () => Navigator.of(context)
                            .push(MaterialPageRoute(builder: (_) => const TripHistoryScreen())),
                      ),
                      _NavRow(
                        icon: Icons.feedback_outlined,
                        label: 'Feedback & ratings',
                        onTap: () => Navigator.of(context)
                            .push(MaterialPageRoute(builder: (_) => const FeedbackScreen())),
                      ),
                      _NavRow(
                        icon: Icons.settings_outlined,
                        label: l.t('common.settings'),
                        onTap: () => Navigator.of(context)
                            .push(MaterialPageRoute(builder: (_) => const SettingsScreen())),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  OutlinedButton.icon(
                    onPressed: () => context.read<AuthState>().signOut(),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFEF4444),
                      side: const BorderSide(color: Color(0x40EF4444)),
                    ),
                    icon: const Icon(Icons.logout_rounded, size: 18),
                    label: Text(l.t('action.signOut')),
                  ),
                ],
              ),
      ),
    );
  }
}

class _GroupLabel extends StatelessWidget {
  const _GroupLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.7,
          color: Color(0xFF8A90A2),
        ),
      ),
    );
  }
}

class _CardGroup extends StatelessWidget {
  const _CardGroup({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      rows.add(children[i]);
      if (i != children.length - 1) rows.add(Divider(height: 1, color: theme.dividerColor));
    }
    return Container(
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: theme.dividerColor),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(children: rows),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.value});
  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, size: 20, color: const Color(0xFF8A90A2)),
          const SizedBox(width: 14),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }
}

class _NavRow extends StatelessWidget {
  const _NavRow({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 20, color: const Color(0xFF0A5796)),
            const SizedBox(width: 14),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500))),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFF8A90A2)),
          ],
        ),
      ),
    );
  }
}
