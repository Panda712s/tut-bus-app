import 'package:flutter/material.dart';
import '../models/transport_models.dart';

const _accent = Color(0xFF0A5796);
const _muted = Color(0xFF8A90A2);

/// Distance / duration / active-bus count strip at the top of a route screen.
class StatStrip extends StatelessWidget {
  const StatStrip({super.key, required this.route, required this.liveBusCount});

  final BusRoute route;
  final int liveBusCount;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Row(
        children: [
          Expanded(
            child: StatItem(
              icon: Icons.route_outlined,
              value: route.distanceKm != null ? '${route.distanceKm} km' : '—',
              label: 'Distance',
            ),
          ),
          VerticalDivider(width: 1, thickness: 1, indent: 6, endIndent: 6, color: theme.dividerColor),
          Expanded(
            child: StatItem(
              icon: Icons.timelapse_rounded,
              value: route.estimatedDurationMin != null ? '${route.estimatedDurationMin} min' : '—',
              label: 'Duration',
            ),
          ),
          VerticalDivider(width: 1, thickness: 1, indent: 6, endIndent: 6, color: theme.dividerColor),
          Expanded(
            child: StatItem(
              icon: Icons.directions_bus_filled_rounded,
              value: '$liveBusCount',
              label: 'Active buses',
            ),
          ),
        ],
      ),
    );
  }
}

class StatItem extends StatelessWidget {
  const StatItem({super.key, required this.icon, required this.value, required this.label});

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 19, color: _accent),
        const SizedBox(height: 6),
        Text(value, style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800, letterSpacing: -0.2)),
        const SizedBox(height: 1),
        Text(label, style: const TextStyle(fontSize: 11, color: _muted)),
      ],
    );
  }
}
