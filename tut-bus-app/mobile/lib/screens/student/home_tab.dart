import 'package:flutter/material.dart';
import '../../models/transport_models.dart';
import '../../models/user_models.dart';
import '../../services/student_repository.dart';
import '../../services/transport_repository.dart';
import '../../widgets/capacity_badge.dart';
import '../../widgets/state_views.dart';
import 'route_detail_screen.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  final _studentRepo = StudentRepository();
  final _transportRepo = TransportRepository();

  StudentProfile? _profile;
  List<BusRoute> _favourites = [];
  List<LiveBus> _nearbyBuses = [];
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
      final results = await Future.wait([
        _studentRepo.fetchMyProfile(),
        _transportRepo.fetchFavouriteRoutes(),
        _transportRepo.fetchLiveBuses(),
      ]);
      setState(() {
        _profile = results[0] as StudentProfile;
        _favourites = results[1] as List<BusRoute>;
        _nearbyBuses = (results[2] as List<LiveBus>).take(5).toList();
      });
    } catch (e) {
      setState(() => _error = 'Could not load your dashboard. Pull down to retry.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('TUT Bus App')),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      Text(
                        'Hi, ${_profile?.fullName.split(' ').first ?? 'there'} 👋',
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: -0.3),
                      ),
                      const SizedBox(height: 4),
                      const Text('Here is what is happening on campus transport today.', style: TextStyle(color: Colors.white70)),
                      const SizedBox(height: 20),
                      _WeatherAnnouncementCard(),
                      const SizedBox(height: 24),
                      const Text('Active buses nearby', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                      const SizedBox(height: 10),
                      if (_nearbyBuses.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8),
                          child: Text('No buses are currently active.', style: TextStyle(color: Colors.white60)),
                        )
                      else
                        ..._nearbyBuses.map(
                          (bus) => Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: const BorderSide(color: Color(0xFF262B3A)),
                            ),
                            child: ListTile(
                              leading: const Icon(Icons.directions_bus_filled_rounded, color: Color(0xFF8B5CF6)),
                              title: Text(bus.busNumber),
                              subtitle: Text('${bus.passengerCount}/${bus.capacity} passengers'),
                              trailing: CapacityBadge(state: bus.capacityState),
                            ),
                          ),
                        ),
                      const SizedBox(height: 16),
                      const Text('Your favourite routes', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                      const SizedBox(height: 10),
                      if (_favourites.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8),
                          child: Text('Star a route from the Routes tab to pin it here.', style: TextStyle(color: Colors.white60)),
                        )
                      else
                        ..._favourites.map(
                          (route) => Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: const BorderSide(color: Color(0xFF262B3A)),
                            ),
                            child: ListTile(
                              leading: const Icon(Icons.star_rounded, color: Colors.amber),
                              title: Text(route.name),
                              subtitle: Text('${route.origin} → ${route.destination}'),
                              onTap: () => Navigator.of(context)
                                  .push(MaterialPageRoute(builder: (_) => RouteDetailScreen(routeId: route.id))),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }
}

class _WeatherAnnouncementCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(color: Color(0x331E63E0), blurRadius: 16, offset: Offset(0, 6)),
        ],
      ),
      child: const Row(
        children: [
          Icon(Icons.wb_sunny_rounded, color: Colors.white, size: 28),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Clear skies, 22°C', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                SizedBox(height: 2),
                Text(
                  'No campus announcements right now.',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
