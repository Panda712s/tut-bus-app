import 'package:flutter/material.dart';
import '../../models/transport_models.dart';
import '../../models/user_models.dart';
import '../../services/driver_repository.dart';
import '../../services/transport_repository.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/state_views.dart';
import '../../widgets/tut_background.dart';
import 'driver_trip_screen.dart';

const _accent = Color(0xFF0A5796);
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
        child: _loading
            ? const LoadingView()
            : _error != null
                ? ErrorView(message: _error!, onRetry: _load)
                : RefreshIndicator(
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
                            _StatusPill(status: _profile?.status ?? '—'),
                          ],
                        ),
                        const SizedBox(height: 22),
                        if (_profile?.assignedBusId == null)
                          const _EmptyBusCard()
                        else if (_activeTrip != null)
                          _ActiveTripCard(
                            status: _activeTrip!['status'] as String,
                            onResume: () async {
                              await Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => DriverTripScreen(trip: _activeTrip!, busId: _profile!.assignedBusId!),
                                ),
                              );
                              _load();
                            },
                          )
                        else
                          _StartTripCard(
                            routes: _routes,
                            selectedRouteId: _selectedRouteId,
                            onRouteChanged: (v) => setState(() => _selectedRouteId = v),
                            starting: _starting,
                            onStart: _startTrip,
                          ),
                      ],
                    ),
                  ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final isActive = status == 'ACTIVE' || status == 'ON_TRIP';
    final color = isActive ? const Color(0xFF15803D) : _muted;
    final bg = isActive ? const Color(0x1F16A34A) : const Color(0x140A5796);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.2),
      ),
    );
  }
}

class _EmptyBusCard extends StatelessWidget {
  const _EmptyBusCard();

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

class _ActiveTripCard extends StatelessWidget {
  const _ActiveTripCard({required this.status, required this.onResume});
  final String status;
  final VoidCallback onResume;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0A5796), Color(0xFF073E68)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [BoxShadow(color: Color(0x330A5796), blurRadius: 24, offset: Offset(0, 10))],
        ),
        child: Row(
          children: [
            Container(
              height: 50,
              width: 50,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(15)),
              child: const Icon(Icons.play_circle_fill_rounded, color: Colors.white, size: 26),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Trip in progress', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15.5)),
                  const SizedBox(height: 3),
                  Text('Status: ${status.replaceAll('_', ' ')}', style: TextStyle(color: Colors.white.withValues(alpha: 0.78), fontSize: 12.5)),
                ],
              ),
            ),
            const SizedBox(width: 10),
            FilledButton(
              onPressed: onResume,
              style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: _accent),
              child: const Text('Resume'),
            ),
          ],
        ),
      ),
    );
  }
}

class _StartTripCard extends StatelessWidget {
  const _StartTripCard({
    required this.routes,
    required this.selectedRouteId,
    required this.onRouteChanged,
    required this.starting,
    required this.onStart,
  });

  final List<BusRoute> routes;
  final String? selectedRouteId;
  final ValueChanged<String?> onRouteChanged;
  final bool starting;
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 34,
                width: 34,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: const Color(0x140A5796), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.route_rounded, size: 18, color: _accent),
              ),
              const SizedBox(width: 10),
              const Text('Start a new trip', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5)),
            ],
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: selectedRouteId,
            decoration: const InputDecoration(labelText: 'Route'),
            items: routes.map((r) => DropdownMenuItem(value: r.id, child: Text(r.name))).toList(),
            onChanged: onRouteChanged,
          ),
          const SizedBox(height: 18),
          PrimaryButton(label: 'Start trip', loading: starting, onPressed: onStart),
        ],
      ),
    );
  }
}
