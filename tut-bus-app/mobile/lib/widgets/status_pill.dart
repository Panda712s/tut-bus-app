import 'package:flutter/material.dart';

const _muted = Color(0xFF8A90A2);

/// Small rounded badge showing a driver's current status (e.g. ACTIVE,
/// ON_TRIP), highlighted green when active.
class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final isActive = status == 'ACTIVE' || status == 'ON_TRIP';
    final color = isActive ? const Color(0xFF15803D) : _muted;
    final bg = isActive ? const Color(0x1F16A34A) : const Color(0x140A5796);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.2),
      ),
    );
  }
}
