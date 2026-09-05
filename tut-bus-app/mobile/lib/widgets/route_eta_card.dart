import 'package:flutter/material.dart';
import '../services/eta_repository.dart';
import 'live_pill.dart';

const _accent = Color(0xFF0A5796);
const _muted = Color(0xFF8A90A2);

/// Live "next arrivals" estimate card, one row per bus's nearest upcoming stop.
class RouteEtaCard extends StatelessWidget {
  const RouteEtaCard({super.key, required this.etas});

  final List<RouteEtaBus> etas;

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (final bus in etas) {
      if (bus.stops.isEmpty) continue;
      rows.add(RouteEtaRow(bus: bus, next: bus.stops.first));
    }
    if (rows.isEmpty) return const SizedBox.shrink();

    return Container(
      decoration: BoxDecoration(
        color: const Color(0x0D0A5796),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x260A5796)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 8),
            child: Row(
              children: [
                Container(
                  height: 30,
                  width: 30,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: const Color(0x1F0A5796), borderRadius: BorderRadius.circular(9)),
                  child: const Icon(Icons.timer_outlined, size: 16, color: _accent),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text('Next arrivals', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5)),
                ),
                const LivePill(),
              ],
            ),
          ),
          for (var i = 0; i < rows.length; i++) ...[
            if (i != 0) const Divider(height: 1, color: Color(0x1A0A5796)),
            rows[i],
          ],
          const SizedBox(height: 6),
        ],
      ),
    );
  }
}

class RouteEtaRow extends StatelessWidget {
  const RouteEtaRow({super.key, required this.bus, required this.next});

  final RouteEtaBus bus;
  final StopEtaEntry next;

  @override
  Widget build(BuildContext context) {
    final arriving = next.label == 'now';
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
      child: Row(
        children: [
          Container(
            height: 34,
            width: 34,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.directions_bus_filled_rounded, size: 17, color: _accent),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(bus.busNumber, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                const SizedBox(height: 1),
                Text('→ ${next.stopName}',
                    style: const TextStyle(fontSize: 12, color: _muted), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: arriving ? const Color(0x1F16A34A) : const Color(0x1F0A5796),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              arriving ? 'Arriving' : next.label,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 12,
                color: arriving ? const Color(0xFF15803D) : _accent,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
