import 'package:flutter/material.dart';

const _accent = Color(0xFF0A5796);
const _muted = Color(0xFF8A90A2);

/// Shown on the driver dashboard when the signed-in driver has no bus
/// assigned yet, so they can't start a trip.
class EmptyBusCard extends StatelessWidget {
  const EmptyBusCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        children: [
          Container(
            height: 52,
            width: 52,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: const Color(0x140A5796), borderRadius: BorderRadius.circular(16)),
            child: const Icon(Icons.directions_bus_outlined, color: _accent, size: 26),
          ),
          const SizedBox(height: 14),
          const Text('No bus assigned yet', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5)),
          const SizedBox(height: 6),
          const Text(
            'Contact your transport administrator to get assigned to a bus before you can start a trip.',
            textAlign: TextAlign.center,
            style: TextStyle(color: _muted, fontSize: 13, height: 1.4),
          ),
        ],
      ),
    );
  }
}
