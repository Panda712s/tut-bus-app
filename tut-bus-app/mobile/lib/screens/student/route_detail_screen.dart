import 'package:flutter/material.dart';
import '../../models/transport_models.dart';
import '../../services/transport_repository.dart';
import '../../services/eta_repository.dart';
import '../../widgets/state_views.dart';
import 'board_trip_screen.dart';

const _dayTypes = ['WEEKDAY', 'WEEKEND', 'HOLIDAY'];

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

    return Scaffold(
      appBar: AppBar(
        title: Text(route.name),
        actions: [
          IconButton(
            icon: Icon(_isFavourite ? Icons.star_rounded : Icons.star_border_rounded,
                color: _isFavourite ? Colors.amber : null),
            onPressed: _toggleFavourite,
          ),
        ],
      ),
      body: ListView(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: _InfoTile(label: 'Distance', value: route.distanceKm != null ? '${route.distanceKm} km' : '—'),
                ),
                Expanded(
                  child: _InfoTile(
                    label: 'Duration',
                    value: route.estimatedDurationMin != null ? '${route.estimatedDurationMin} min' : '—',
                  ),
                ),
                Expanded(child: _InfoTile(label: 'Active buses', value: '${_liveBuses.length}')),
              ],
            ),
          ),
          if (_etas.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Card(
                elevation: 0,
                color: const Color(0x148B5CF6),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: Color(0x338B5CF6)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.schedule_rounded, size: 18, color: Color(0xFF8B5CF6)),
                          SizedBox(width: 6),
                          Text('Next arrivals', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFC4B5FD))),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ..._etas.expand((bus) {
                        final next = bus.stops.isNotEmpty ? bus.stops.first : null;
                        if (next == null) return <Widget>[];
                        return <Widget>[
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 3),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    '${bus.busNumber} → ${next.stopName}',
                                    style: const TextStyle(fontSize: 13),
                                  ),
                                ),
                                Text(
                                  next.label,
                                  style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFC4B5FD)),
                                ),
                              ],
                            ),
                          ),
                        ];
                      }),
                    ],
                  ),
                ),
              ),
            ),
          if (_liveBuses.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Buses on this route now', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  ..._liveBuses.map(
                    (bus) => Card(
                      child: ListTile(
                        leading: const Icon(Icons.directions_bus_filled_rounded, color: Color(0xFF8B5CF6)),
                        title: Text(bus.busNumber),
                        subtitle: Text('${bus.passengerCount}/${bus.capacity} passengers'),
                        trailing: FilledButton(
                          onPressed: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => BoardTripScreen(bus: bus, route: route)),
                          ),
                          child: const Text('Board'),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          const Divider(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text('Stops (${route.stops.length})', style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
          ...route.stops.map(
            (s) => ListTile(
              leading: const Icon(Icons.location_on_outlined),
              title: Text(s.name),
              subtitle: Text('${s.lat.toStringAsFixed(4)}, ${s.lng.toStringAsFixed(4)}'),
            ),
          ),
          const Divider(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text('Schedule', style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
          TabBar(
            controller: _tabController,
            labelColor: const Color(0xFF8B5CF6),
            tabs: _dayTypes.map((d) => Tab(text: d[0] + d.substring(1).toLowerCase())).toList(),
          ),
          SizedBox(
            height: 160,
            child: _currentSchedules.isEmpty
                ? const EmptyView(message: 'No departures listed for this day type.', icon: Icons.schedule_outlined)
                : ListView(
                    children: _currentSchedules
                        .map((s) => ListTile(
                              leading: const Icon(Icons.schedule),
                              title: Text(s.departureTime),
                              subtitle: Text(s.period),
                            ))
                        .toList(),
                  ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF8A90A2))),
      ],
    );
  }
}
