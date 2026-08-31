import 'package:flutter/material.dart';
import '../models/transport_models.dart';

class CapacityBadge extends StatelessWidget {
  const CapacityBadge({super.key, required this.state});

  final CapacityState state;

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color dot, Color text, String label) = switch (state) {
      CapacityState.empty => (
          const Color(0xFFDCFCE7),
          const Color(0xFF22C55E),
          const Color(0xFF15803D),
          'Empty',
        ),
      CapacityState.moderate => (
          const Color(0xFFFEF3C7),
          const Color(0xFFF59E0B),
          const Color(0xFFB45309),
          'Moderate',
        ),
      CapacityState.full => (
          const Color(0xFFFEE2E2),
          const Color(0xFFEF4444),
          const Color(0xFFB91C1C),
          'Full',
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: dot, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(color: text, fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
