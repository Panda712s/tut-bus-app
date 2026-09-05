import 'package:flutter/material.dart';
import '../../models/transport_models.dart';
import '../../services/transport_repository.dart';
import '../../services/eta_repository.dart';
import '../../widgets/live_bus_tile.dart';
import '../../widgets/route_eta_card.dart';
import '../../widgets/section_label.dart';
import '../../widgets/state_views.dart';
import '../../widgets/stat_strip.dart';
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
          StatStrip(route: route, liveBusCount: _liveBuses.length),
          if (_etas.isNotEmpty) ...[
            const SizedBox(height: 14),
            RouteEtaCard(etas: _etas),
          ],
          if (_liveBuses.isNotEmpty) ...[
            const SizedBox(height: 22),
            const SectionLabel('Buses on this route now'),
            const SizedBox(height: 10),
            ..._liveBuses.map(
              (bus) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: LiveBusTile(
                  bus: bus,
                  onBoard: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => BoardTripScreen(bus: bus, route: route)),
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: 22),
          SectionLabel('Stops (${route.stops.length})'),
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
          const SectionLabel('Schedule'),
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

