import 'package:flutter/material.dart';
import '../models/transport_models.dart';
import 'capacity_badge.dart';

const _accent = Color(0xFF0A5796);
const _muted = Color(0xFF8A90A2);

/// Card for a single live bus on a route, with a "Board" action.
class LiveBusTile extends StatelessWidget {
  const LiveBusTile({super.key, required this.bus, required this.onBoard});

  final LiveBus bus;
  final VoidCallback onBoard;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Row(
        children: [
          Container(
            height: 40,
            width: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: const Color(0x1F0A5796), borderRadius: BorderRadius.circular(11)),
            child: const Icon(Icons.directions_bus_filled_rounded, color: _accent, size: 21),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(bus.busNumber, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5)),
                const SizedBox(height: 3),
                Text('${bus.passengerCount}/${bus.capacity} passengers',
                    style: const TextStyle(fontSize: 12, color: _muted)),
                const SizedBox(height: 6),
                CapacityBadge(state: bus.capacityState),
              ],
            ),
          ),
          const SizedBox(width: 8),
          FilledButton(onPressed: onBoard, child: const Text('Board')),
        ],
      ),
    );
  }
}
