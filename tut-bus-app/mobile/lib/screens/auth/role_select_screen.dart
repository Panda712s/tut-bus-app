import 'package:flutter/material.dart';
import '../../widgets/auth_backdrop.dart';
import 'student_login_screen.dart';
import 'driver_login_screen.dart';

class RoleSelectScreen extends StatelessWidget {
  const RoleSelectScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AuthBackdrop(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 48, 24, 32),
          child: Column(
            children: [
              const AuthHeader(
                title: 'TUT Bus App',
                subtitle: 'Smart Campus Bus Tracking and Management System',
                logoHeight: 72,
              ),
              const SizedBox(height: 44),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'CONTINUE AS',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                    color: Theme.of(context).hintColor,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _RoleCard(
                title: 'Student',
                subtitle: 'Track buses, view schedules, get notified',
                icon: Icons.school_rounded,
                onTap: () => Navigator.of(context)
                    .push(MaterialPageRoute(builder: (_) => const StudentLoginScreen())),
              ),
              const SizedBox(height: 14),
              _RoleCard(
                title: 'Driver',
                subtitle: 'Start trips and share your live location',
                icon: Icons.airport_shuttle_rounded,
                onTap: () => Navigator.of(context)
                    .push(MaterialPageRoute(builder: (_) => const DriverLoginScreen())),
              ),
              const SizedBox(height: 32),
              Text(
                'Administrators sign in on the web dashboard',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({required this.title, required this.subtitle, required this.icon, required this.onTap});

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: theme.cardColor,
      borderRadius: BorderRadius.circular(18),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: theme.dividerColor),
          ),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                Container(
                  height: 48,
                  width: 48,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: const Color(0x1F0A5796),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: const Color(0xFF0A5796), size: 26),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                      const SizedBox(height: 3),
                      Text(subtitle, style: const TextStyle(color: Color(0xFF8A90A2), fontSize: 12.5, height: 1.3)),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward_rounded, color: Color(0xFF0A5796), size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
