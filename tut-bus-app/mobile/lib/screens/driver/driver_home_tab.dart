import 'package:flutter/material.dart';
import '../../models/transport_models.dart';
import '../../models/user_models.dart';
import '../../services/driver_repository.dart';
import '../../services/transport_repository.dart';
import '../../widgets/active_trip_card.dart';
import '../../widgets/empty_bus_card.dart';
import '../../widgets/start_trip_card.dart';
import '../../widgets/state_views.dart';
import '../../widgets/status_pill.dart';
import '../../widgets/tut_background.dart';
import '../../widgets/weather_card.dart';
import 'driver_trip_screen.dart';

const _muted = Color(0xFF8A90A2);

class DriverHomeTab extends StatefulWidget {
  const DriverHomeTab({super.key});

  @override
  State<DriverHomeTab> createState() => _DriverHomeTabState();
}

class _DriverHomeTabState extends State<DriverHomeTab> {
  final _driverRepo = DriverRepository();
  final _transportRepo = TransportRepository();

  DriverProfile? _profile;
  List<BusRoute> _routes = [];
  String? _selectedRouteId;
  Map<String, dynamic>? _activeTrip;
  bool _loading = true;
  String? _error;
  bool _starting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final profile = await _driverRepo.fetchMyProfile();
      final routes = await _transportRepo.fetchRoutes();
      final trips = await _driverRepo.fetchMyTrips(driverId: profile.id);
      final active = trips.where((t) => t['status'] == 'IN_PROGRESS' || t['status'] == 'PAUSED');
      if (!mounted) return;
      setState(() {
        _profile = profile;
        _routes = routes;
        _selectedRouteId = routes.isNotEmpty ? routes.first.id : null;
        _activeTrip = active.isNotEmpty ? active.first : null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = 'Could not load your dashboard.\n$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _startTrip() async {
    if (_profile?.assignedBusId == null || _selectedRouteId == null) return;
    setState(() => _starting = true);
    try {
      final trip = await _driverRepo.startTrip(busId: _profile!.assignedBusId!, routeId: _selectedRouteId!);
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => DriverTripScreen(trip: trip, busId: _profile!.assignedBusId!)),
      );
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not start trip: $e')));
      }
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Driver Dashboard'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded), tooltip: 'Refresh'),
        ],
      ),
      body: TutBackground(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 280),
          child: _loading
              ? const LoadingView(key: ValueKey('loading'))
              : _error != null
                  ? ErrorView(key: const ValueKey('error'), message: _error!, onRetry: _load)
                  : RefreshIndicator(
                      key: const ValueKey('content'),
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Hi, ${_profile?.fullName.split(' ').first ?? 'Driver'} 👋',
                                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.4),
                                    ),
                                    const SizedBox(height: 4),
                                    const Text(
                                      "Here's your shift for today.",
                                      style: TextStyle(color: _muted, fontSize: 13.5),
                                    ),
                                  ],
                                ),
                              ),
                              StatusPill(status: _profile?.status ?? '—'),
                            ],
                          ),
                          const SizedBox(height: 20),
                          const WeatherCard(footer: 'Clear roads reported on your route.'),
                          const SizedBox(height: 22),
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 280),
                            transitionBuilder: (child, anim) => FadeTransition(
                              opacity: anim,
                              child: SizeTransition(sizeFactor: anim, child: child),
                            ),
                            child: _profile?.assignedBusId == null
                                ? const EmptyBusCard(key: ValueKey('no-bus'))
                                : _activeTrip != null
                                    ? ActiveTripCard(
                                        key: const ValueKey('active-trip'),
                                        status: _activeTrip!['status'] as String,
                                        onResume: () async {
                                          await Navigator.of(context).push(
                                            MaterialPageRoute(
                                              builder: (_) =>
                                                  DriverTripScreen(trip: _activeTrip!, busId: _profile!.assignedBusId!),
                                            ),
                                          );
                                          _load();
                                        },
                                      )
                                    : StartTripCard(
                                        key: const ValueKey('start-trip'),
                                        routes: _routes,
                                        selectedRouteId: _selectedRouteId,
                                        onRouteChanged: (v) => setState(() => _selectedRouteId = v),
                                        starting: _starting,
                                        onStart: _startTrip,
                                      ),
                          ),
                        ],
                      ),
                    ),
        ),
      ),
    );
  }
}

