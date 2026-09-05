import 'package:flutter/material.dart';
import '../services/eta_repository.dart';

const _accent = Color(0xFF0A5796);
const _muted = Color(0xFF8A90A2);

/// Estimated arrival time at each stop still ahead on the route, computed
/// from this bus's live position and speed - so the driver can see how far
/// behind or ahead of schedule they're running without checking a phone map.
class UpcomingStopsCard extends StatelessWidget {
  const UpcomingStopsCard({super.key, required this.loading, required this.stops});

  final bool loading;
  final List<StopEtaEntry> stops;

  @override
  Widget build(BuildContext context) {
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
                  child: Text('Upcoming stops', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5)),
                ),
              ],
            ),
          ),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 280),
            child: loading
                ? const Padding(
                    key: ValueKey('loading'),
                    padding: EdgeInsets.fromLTRB(14, 4, 14, 16),
                    child: SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : stops.isEmpty
                    ? const Padding(
                        key: ValueKey('empty'),
                        padding: EdgeInsets.fromLTRB(14, 0, 14, 16),
                        child: Text(
                          'No estimate yet - this needs a live GPS fix and at least one stop ahead on the route.',
                          style: TextStyle(fontSize: 12.5, color: _muted, height: 1.35),
                        ),
                      )
                    : Column(
                        key: const ValueKey('stops'),
                        children: [
                          for (var i = 0; i < stops.length; i++) ...[
                            if (i != 0) const Divider(height: 1, color: Color(0x1A0A5796)),
                            StopEtaRow(stop: stops[i]),
                          ],
                          const SizedBox(height: 6),
                        ],
                      ),
          ),
        ],
      ),
    );
  }
}

class StopEtaRow extends StatelessWidget {
  const StopEtaRow({super.key, required this.stop});

  final StopEtaEntry stop;

  @override
  Widget build(BuildContext context) {
    final arriving = stop.label == 'now';
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
      child: Row(
        children: [
          Container(
            height: 30,
            width: 30,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(9)),
            child: const Icon(Icons.location_on_outlined, size: 16, color: Color(0xFFFAB416)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(stop.stopName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: arriving ? const Color(0x1F16A34A) : const Color(0x1F0A5796),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              arriving ? 'Arriving' : stop.label,
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
