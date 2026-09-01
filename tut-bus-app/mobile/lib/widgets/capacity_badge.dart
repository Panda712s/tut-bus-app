import 'package:flutter/material.dart';
import '../models/transport_models.dart';

class CapacityBadge extends StatelessWidget {
  const CapacityBadge({super.key, required this.state});

  final CapacityState state;

  @override
  Widget build(BuildContext context) {
    // Dark-tuned: translucent fill, saturated dot, bright label.
    final (Color bg, Color dot, Color text, String label) = switch (state) {
      CapacityState.empty => (
          const Color(0x2634D399),
          const Color(0xFF34D399),
          const Color(0xFF6EE7B7),
          'Empty',
        ),
      CapacityState.moderate => (
          const Color(0x26FBBF24),
          const Color(0xFFFBBF24),
          const Color(0xFFFCD34D),
          'Moderate',
        ),
      CapacityState.full => (
          const Color(0x26F87171),
          const Color(0xFFF87171),
          const Color(0xFFFCA5A5),
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
