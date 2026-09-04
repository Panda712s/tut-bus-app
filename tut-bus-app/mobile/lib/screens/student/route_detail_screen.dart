import 'package:flutter/material.dart';
import '../../models/transport_models.dart';
import '../../services/transport_repository.dart';
import '../../services/eta_repository.dart';
import '../../widgets/capacity_badge.dart';
import '../../widgets/state_views.dart';
import 'board_trip_screen.dart';

const _dayTypes = ['WEEKDAY', 'WEEKEND', 'HOLIDAY'];
const _accent = Color(0xFF0A5796);
const _muted = Color(0xFF8A90A2);

class RouteDetailScreen extends StatefulWidget {
  const RouteDetailScreen({super.key, required this.routeId});

  final String routeId;

  @override
  State<RouteDetailScreen> createState() => _RouteDetailScreenState();
}

class _RouteDetailScreenState extends State<RouteDetailScreen> with SingleTickerProviderStateMixin {
  final _repo = TransportRepository();
  final _etaRepo = EtaRepository();
  BusRoute? _route;
  List<LiveBus> _liveBuses = [];
  List<RouteEtaBus> _etas = [];
  bool _isFavourite = false;
  bool _loading = true;
  late final TabController _tabController;
  final Map<String, List<Schedule>> _scheduleCache = {};
  List<Schedule> _currentSchedules = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _dayTypes.length, vsync: this)
      ..addListener(() {
        if (!_tabController.indexIsChanging) _loadSchedule(_dayTypes[_tabController.index]);
      });
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _repo.fetchRoute(widget.routeId),
        _repo.fetchLiveBuses(routeId: widget.routeId),
        _repo.fetchFavouriteRoutes(),
      ]);
      setState(() {
        _route = results[0] as BusRoute;
        _liveBuses = results[1] as List<LiveBus>;
        _isFavourite = (results[2] as List<BusRoute>).any((r) => r.id == widget.routeId);
      });
      _etaRepo.forRoute(widget.routeId).then((e) {
        if (mounted) setState(() => _etas = e);
      }).catchError((_) {});
      await _loadSchedule(_dayTypes[0]);
    } catch (_) {
      // keep whatever loaded successfully
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadSchedule(String dayType) async {
    if (_scheduleCache.containsKey(dayType)) {
      setState(() => _currentSchedules = _scheduleCache[dayType]!);
      return;
    }
    final schedules = await _repo.fetchSchedules(widget.routeId, dayType: dayType);
    _scheduleCache[dayType] = schedules;
    if (mounted) setState(() => _currentSchedules = schedules);
  }

  Future<void> _toggleFavourite() async {
    setState(() => _isFavourite = !_isFavourite);
    try {
      if (_isFavourite) {
        await _repo.addFavouriteRoute(widget.routeId);
      } else {
        await _repo.removeFavouriteRoute(widget.routeId);
      }
    } catch (_) {
      setState(() => _isFavourite = !_isFavourite); // revert on failure
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _route == null) {
      return const Scaffold(body: LoadingView());
    }
    if (_route == null) {
      return const Scaffold(body: ErrorView(message: 'Could not load this route.'));
    }
    final route = _route!;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(route.name),
        actions: [
          IconButton(
            icon: Icon(_isFavourite ? Icons.star_rounded : Icons.star_border_rounded,
                color: _isFavourite ? const Color(0xFFFAB416) : null),
            onPressed: _toggleFavourite,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          _StatStrip(route: route, liveBusCount: _liveBuses.length),
          if (_etas.isNotEmpty) ...[
            const SizedBox(height: 14),
            _EtaCard(etas: _etas),
          ],
          if (_liveBuses.isNotEmpty) ...[
            const SizedBox(height: 22),
            const _SectionLabel('Buses on this route now'),
            const SizedBox(height: 10),
            ..._liveBuses.map(
              (bus) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _LiveBusTile(
                  bus: bus,
                  onBoard: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => BoardTripScreen(bus: bus, route: route)),
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: 22),
          _SectionLabel('Stops (${route.stops.length})'),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: theme.dividerColor),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: [
                for (var i = 0; i < route.stops.length; i++) ...[
                  if (i != 0) Divider(height: 1, color: theme.dividerColor),
                  ListTile(
                    dense: true,
                    leading: const Icon(Icons.location_on_outlined, color: _accent, size: 20),
                    title: Text(route.stops[i].name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    subtitle: Text(
                      '${route.stops[i].lat.toStringAsFixed(4)}, ${route.stops[i].lng.toStringAsFixed(4)}',
                      style: const TextStyle(fontSize: 11.5, color: _muted),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 22),
          const _SectionLabel('Schedule'),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: theme.dividerColor),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: [
                TabBar(
                  controller: _tabController,
                  labelColor: _accent,
                  unselectedLabelColor: _muted,
                  indicatorColor: _accent,
                  labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                  tabs: _dayTypes.map((d) => Tab(text: d[0] + d.substring(1).toLowerCase())).toList(),
                ),
                Divider(height: 1, color: theme.dividerColor),
                SizedBox(
                  height: 170,
                  child: _currentSchedules.isEmpty
                      ? const EmptyView(message: 'No departures listed for this day type.', icon: Icons.schedule_outlined)
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          itemCount: _currentSchedules.length,
                          separatorBuilder: (_, __) => Divider(height: 1, color: theme.dividerColor),
                          itemBuilder: (context, i) {
                            final s = _currentSchedules[i];
                            return ListTile(
                              dense: true,
                              leading: const Icon(Icons.schedule, color: _accent, size: 20),
                              title: Text(s.departureTime, style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text(s.period, style: const TextStyle(fontSize: 12, color: _muted)),
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(text, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5));
  }
}

/// Distance / duration / active-bus count strip at the top of the screen.
class _StatStrip extends StatelessWidget {
  const _StatStrip({required this.route, required this.liveBusCount});

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
            child: _StatItem(
              icon: Icons.route_outlined,
              value: route.distanceKm != null ? '${route.distanceKm} km' : '—',
              label: 'Distance',
            ),
          ),
          VerticalDivider(width: 1, thickness: 1, indent: 6, endIndent: 6, color: theme.dividerColor),
          Expanded(
            child: _StatItem(
              icon: Icons.timelapse_rounded,
              value: route.estimatedDurationMin != null ? '${route.estimatedDurationMin} min' : '—',
              label: 'Duration',
            ),
          ),
          VerticalDivider(width: 1, thickness: 1, indent: 6, endIndent: 6, color: theme.dividerColor),
          Expanded(
            child: _StatItem(
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

class _StatItem extends StatelessWidget {
  const _StatItem({required this.icon, required this.value, required this.label});

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

/// Live "next arrivals" estimate card, one row per bus's nearest upcoming stop.
class _EtaCard extends StatelessWidget {
  const _EtaCard({required this.etas});

  final List<RouteEtaBus> etas;

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (final bus in etas) {
      if (bus.stops.isEmpty) continue;
      rows.add(_EtaRow(bus: bus, next: bus.stops.first));
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
                const _LivePill(),
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

class _EtaRow extends StatelessWidget {
  const _EtaRow({required this.bus, required this.next});

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

class _LivePill extends StatelessWidget {
  const _LivePill();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: const Color(0x1F16A34A), borderRadius: BorderRadius.circular(999)),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _Dot(),
          SizedBox(width: 5),
          Text('Live', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Color(0xFF15803D))),
        ],
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  const _Dot();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 6,
      height: 6,
      decoration: const BoxDecoration(color: Color(0xFF22C55E), shape: BoxShape.circle),
    );
  }
}

class _LiveBusTile extends StatelessWidget {
  const _LiveBusTile({required this.bus, required this.onBoard});

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
