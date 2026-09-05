import 'package:flutter/material.dart';

const _accent = Color(0xFF0A5796);

/// Highlighted banner on the driver dashboard showing there is a trip in
/// progress, with a shortcut to resume it.
class ActiveTripCard extends StatelessWidget {
  const ActiveTripCard({super.key, required this.status, required this.onResume});
  final String status;
  final VoidCallback onResume;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0A5796), Color(0xFF073E68)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [BoxShadow(color: Color(0x330A5796), blurRadius: 24, offset: Offset(0, 10))],
        ),
        child: Row(
          children: [
            Container(
              height: 50,
              width: 50,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(15)),
              child: const Icon(Icons.play_circle_fill_rounded, color: Colors.white, size: 26),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Trip in progress', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15.5)),
                  const SizedBox(height: 3),
                  Text('Status: ${status.replaceAll('_', ' ')}', style: TextStyle(color: Colors.white.withValues(alpha: 0.78), fontSize: 12.5)),
                ],
              ),
            ),
            const SizedBox(width: 10),
            FilledButton(
              onPressed: onResume,
              style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: _accent),
              child: const Text('Resume'),
            ),
          ],
        ),
      ),
    );
  }
}
