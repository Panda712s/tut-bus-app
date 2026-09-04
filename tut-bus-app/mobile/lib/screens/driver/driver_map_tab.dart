import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../models/transport_models.dart';
import '../../services/driver_repository.dart';
import '../../services/socket_service.dart';
import '../../services/transport_repository.dart';
import '../../widgets/animated_map_controller.dart';

// Default camera centred on the TUT Pretoria campus area.
const _defaultCenter = LatLng(-25.7461, 28.1881);
const _defaultZoom = 12.5;

/// Road map for the driver: the same live fleet view students see, with the
/// driver's own bus picked out so they can see exactly where they are on
/// the road relative to their route and the rest of the fleet.
class DriverMapTab extends StatefulWidget {
  const DriverMapTab({super.key});

  @override
  State<DriverMapTab> createState() => _DriverMapTabState();
}

class _DriverMapTabState extends State<DriverMapTab> with SingleTickerProviderStateMixin {
  final _gpsSocket = GpsSocketService();
  final _transportRepo = TransportRepository();
  final _driverRepo = DriverRepository();
  final _mapController = MapController();
  late final _animatedMap = AnimatedMapController(mapController: _mapController, vsync: this);
  final Map<String, LiveBus> _buses = {};
  String? _myBusId;
  bool _centeredOnMe = false;

  @override
  void initState() {
    super.initState();
    _loadInitial();
    _listenLive();
  }

  Future<void> _loadInitial() async {
    try {
      final profile = await _driverRepo.fetchMyProfile();
      _myBusId = profile.assignedBusId;
    } catch (_) {
      // Not fatal - the map still works without highlighting "my bus".
    }
    try {
      final buses = await _transportRepo.fetchLiveBuses();
      if (!mounted) return;
      setState(() {
        for (final bus in buses) {
          _buses[bus.id] = bus;
        }
      });
      _maybeCenterOnMe();
    } catch (_) {
      // Live socket updates will still arrive; a failed initial fetch isn't fatal.
    }
  }

  void _listenLive() {
    _gpsSocket.connect();
    _gpsSocket.onBusLocation((data) {
      final incoming = LiveBus.fromJson(data);
      if (!mounted) return;
      final previousCapacity = _buses[incoming.id]?.capacity;
      final merged = previousCapacity != null
          ? LiveBus(
              id: incoming.id,
              busNumber: incoming.busNumber,
              lat: incoming.lat,
              lng: incoming.lng,
              heading: incoming.heading,
              speedKmh: incoming.speedKmh,
              capacityState: incoming.capacityState,
              passengerCount: incoming.passengerCount,
              capacity: previousCapacity,
              routeId: incoming.routeId,
            )
          : incoming;
      setState(() => _buses[incoming.id] = merged);
      _maybeCenterOnMe();
    });
  }

  void _maybeCenterOnMe() {
    if (_centeredOnMe || _myBusId == null) return;
    final mine = _buses[_myBusId];
    if (mine?.lat == null || mine?.lng == null) return;
    _centeredOnMe = true;
    _animatedMap.animateTo(dest: LatLng(mine!.lat!, mine.lng!), zoom: 15);
  }

  void _recenter() {
    final mine = _myBusId != null ? _buses[_myBusId] : null;
    if (mine?.lat != null && mine?.lng != null) {
      _animatedMap.animateTo(dest: LatLng(mine!.lat!, mine.lng!), zoom: 15);
    } else {
      _animatedMap.animateTo(dest: _defaultCenter, zoom: _defaultZoom);
    }
  }

  @override
  void dispose() {
    _gpsSocket.dispose();
    _animatedMap.dispose();
    _mapController.dispose();
    super.dispose();
  }

  Color _colourFor(CapacityState state) => switch (state) {
        CapacityState.full => const Color(0xFFEF4444),
        CapacityState.moderate => const Color(0xFFF59E0B),
        CapacityState.empty => const Color(0xFF22C55E),
      };

  List<Marker> get _markers => _buses.values
      .where((b) => b.lat != null && b.lng != null)
      .map(
        (b) => Marker(
          point: LatLng(b.lat!, b.lng!),
          width: b.id == _myBusId ? 56 : 44,
          height: b.id == _myBusId ? 56 : 44,
          child: _BusPin(
            label: b.busNumber,
            colour: _colourFor(b.capacityState),
            isMine: b.id == _myBusId,
            onTap: () => _showBusSheet(b),
          ),
        ),
      )
      .toList();

  void _showBusSheet(LiveBus b) {
    final mine = b.id == _myBusId;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.directions_bus_filled_rounded, color: _colourFor(b.capacityState)),
                const SizedBox(width: 10),
                Text(b.busNumber, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                if (mine) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: const Color(0x1F0A5796), borderRadius: BorderRadius.circular(999)),
                    child: const Text('You', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF0A5796))),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 10),
            Text('${b.passengerCount}/${b.capacity} passengers  ·  ${b.capacityState.name}'),
            if (b.speedKmh != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text('${b.speedKmh!.toStringAsFixed(0)} km/h',
                    style: const TextStyle(color: Color(0xFF8A90A2))),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeCount = _buses.values.where((b) => b.lat != null).length;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Road Map'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: activeCount > 0
                    ? Text('$activeCount live',
                        key: ValueKey(activeCount), style: const TextStyle(fontSize: 13, color: Color(0xFF8A90A2)))
                    : const SizedBox.shrink(key: ValueKey('none')),
              ),
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: const MapOptions(
              initialCenter: _defaultCenter,
              initialZoom: _defaultZoom,
              minZoom: 4,
              maxZoom: 18,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'za.ac.tut.tut_bus_app',
                maxZoom: 19,
              ),
              MarkerLayer(markers: _markers),
              const RichAttributionWidget(
                attributions: [TextSourceAttribution('OpenStreetMap contributors')],
              ),
            ],
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 24,
            child: Center(
              child: AnimatedOpacity(
                duration: const Duration(milliseconds: 300),
                opacity: _buses.isEmpty ? 1 : 0,
                child: const IgnorePointer(child: _MapHint(text: 'No buses are on the road right now.')),
              ),
            ),
          ),
          Positioned(
            right: 16,
            bottom: 24,
            child: FloatingActionButton.small(
              heroTag: 'driver-map-recentre',
              onPressed: _recenter,
              backgroundColor: Theme.of(context).colorScheme.surface,
              foregroundColor: const Color(0xFF0A5796),
              child: const Icon(Icons.my_location_rounded),
            ),
          ),
        ],
      ),
    );
  }
}

class _BusPin extends StatelessWidget {
  const _BusPin({required this.label, required this.colour, required this.isMine, required this.onTap});

  final String label;
  final Color colour;
  final bool isMine;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: colour,
          shape: BoxShape.circle,
          border: Border.all(color: isMine ? const Color(0xFFFAB416) : Colors.white, width: isMine ? 3.5 : 2.5),
          boxShadow: [
            BoxShadow(color: const Color(0x55000000), blurRadius: isMine ? 10 : 6, offset: const Offset(0, 2)),
          ],
        ),
        child: Icon(Icons.directions_bus_filled_rounded, color: Colors.white, size: isMine ? 26 : 20),
      ),
    );
  }
}

class _MapHint extends StatelessWidget {
  const _MapHint({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Theme.of(context).dividerColor),
        boxShadow: const [BoxShadow(color: Color(0x22000000), blurRadius: 12, offset: Offset(0, 4))],
      ),
      child: Text(text, style: const TextStyle(fontSize: 13, color: Color(0xFF8A90A2))),
    );
  }
}
