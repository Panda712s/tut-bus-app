import 'package:flutter/material.dart';
import '../models/transport_models.dart';

class CapacityBadge extends StatelessWidget {
  const CapacityBadge({super.key, required this.state});

  final CapacityState state;

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (state) {
      CapacityState.empty => (Colors.green, 'Empty'),
      CapacityState.moderate => (Colors.amber, 'Moderate'),
      CapacityState.full => (Colors.red, 'Full'),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: color.withRed(color.red ~/ 2).withOpacity(1), fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
