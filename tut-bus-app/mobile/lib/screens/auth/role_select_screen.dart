import 'package:flutter/material.dart';
import 'student_login_screen.dart';
import 'driver_login_screen.dart';

class RoleSelectScreen extends StatelessWidget {
  const RoleSelectScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Container(
                height: 84,
                width: 84,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: const Color(0xFF1E63E0), borderRadius: BorderRadius.circular(20)),
                child: const Icon(Icons.directions_bus_filled_rounded, color: Colors.white, size: 42),
              ),
              const SizedBox(height: 20),
              const Text('TUT Bus App', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
              const SizedBox(height: 8),
              const Text(
                'Smart Campus Bus Tracking and Management System',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.black54),
              ),
              const SizedBox(height: 40),
              _RoleCard(
                title: 'I am a Student',
                subtitle: 'Track buses, view schedules, get notified',
                icon: Icons.school_rounded,
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const StudentLoginScreen())),
              ),
              const SizedBox(height: 16),
              _RoleCard(
                title: 'I am a Driver',
                subtitle: 'Start trips, share your live location',
                icon: Icons.airport_shuttle_rounded,
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DriverLoginScreen())),
              ),
              const Spacer(flex: 2),
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
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.black12),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Icon(icon, color: const Color(0xFF1E63E0), size: 32),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(color: Colors.black54, fontSize: 13)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Colors.black38),
          ],
        ),
      ),
    );
  }
}
