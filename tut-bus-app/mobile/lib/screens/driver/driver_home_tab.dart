import 'package:flutter/material.dart';
import '../../models/transport_models.dart';
import '../../models/user_models.dart';
import '../../services/driver_repository.dart';
import '../../services/transport_repository.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/state_views.dart';
import 'driver_trip_screen.dart';

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
      setState(() {
        _profile = profile;
        _routes = routes;
        _selectedRouteId = routes.isNotEmpty ? routes.first.id : null;
        _activeTrip = active.isNotEmpty ? active.first : null;
      });
    } catch (e) {
      setState(() => _error = 'Could not load your dashboard.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _startTrip() async {
    if (_profile?.assignedBusId == null || _selectedRouteId == null) return;
    try {
      final trip = await _driverRepo.startTrip(busId: _profile!.assignedBusId!, routeId: _selectedRouteId!);
      if (!mounted) return;
      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => DriverTripScreen(trip: trip, busId: _profile!.assignedBusId!)));
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not start trip: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Driver Dashboard')),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      Text('Hi, ${_profile?.fullName ?? 'Driver'}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('Status: ${_profile?.status ?? '—'}', style: const TextStyle(color: Colors.white70)),
                      const SizedBox(height: 24),
                      if (_profile?.assignedBusId == null)
                        const Card(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: Text('You are not currently assigned to a bus. Contact your transport administrator.'),
                          ),
                        )
                      else if (_activeTrip != null)
                        Card(
                          color: Colors.blue.shade50,
                          child: ListTile(
                            leading: const Icon(Icons.play_circle_fill_rounded, color: Color(0xFF0A5796)),
                            title: const Text('You have a trip in progress'),
                            subtitle: Text('Status: ${_activeTrip!['status']}'),
                            trailing: FilledButton(
                              onPressed: () => Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => DriverTripScreen(trip: _activeTrip!, busId: _profile!.assignedBusId!),
                                ),
                              ),
                              child: const Text('Resume'),
                            ),
                          ),
                        )
                      else ...[
                        const Text('Start a new trip', style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 10),
                        DropdownButtonFormField<String>(
                          value: _selectedRouteId,
                          decoration: const InputDecoration(labelText: 'Route', border: OutlineInputBorder()),
                          items: _routes.map((r) => DropdownMenuItem(value: r.id, child: Text(r.name))).toList(),
                          onChanged: (v) => setState(() => _selectedRouteId = v),
                        ),
                        const SizedBox(height: 16),
                        PrimaryButton(label: 'Start trip', onPressed: _startTrip),
                      ],
                    ],
                  ),
                ),
    );
  }
}
