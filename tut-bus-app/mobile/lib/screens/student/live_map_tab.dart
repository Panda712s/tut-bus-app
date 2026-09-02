import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../models/transport_models.dart';
import '../../services/socket_service.dart';
import '../../services/transport_repository.dart';

// Default camera centred on the TUT Pretoria campus area.
const _defaultCenter = LatLng(-25.7461, 28.1881);
const _defaultZoom = 12.5;

class LiveMapTab extends StatefulWidget {
  const LiveMapTab({super.key});

  @override
  State<LiveMapTab> createState() => _LiveMapTabState();
}

class _LiveMapTabState extends State<LiveMapTab> {
  final _gpsSocket = GpsSocketService();
  final _transportRepo = TransportRepository();
  final _mapController = MapController();
  final Map<String, LiveBus> _buses = {};

  @override
  void initState() {
    super.initState();
    _loadInitial();
    _listenLive();
  }

  Future<void> _loadInitial() async {
    try {
      final buses = await _transportRepo.fetchLiveBuses();
      if (!mounted) return;
      setState(() {
        for (final bus in buses) {
          _buses[bus.id] = bus;
        }
      });
    } catch (_) {
      // Live socket updates will still arrive; a failed initial fetch isn't fatal.
    }
  }

  void _listenLive() {
    _gpsSocket.connect();
    _gpsSocket.onBusLocation((data) {
      final incoming = LiveBus.fromJson(data);
      if (!mounted) return;
      // The socket payload doesn't carry the bus's seating capacity, so keep
      // whatever the initial REST fetch already told us.
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
    });
  }

  @override
  void dispose() {
    _gpsSocket.dispose();
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
          width: 44,
          height: 44,
          child: _BusPin(
            label: b.busNumber,
            colour: _colourFor(b.capacityState),
            onTap: () => _showBusSheet(b),
          ),
        ),
      )
      .toList();

  void _showBusSheet(LiveBus b) {
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
        title: const Text('Live Bus Tracking'),
        actions: [
          if (activeCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Text('$activeCount live',
                    style: const TextStyle(fontSize: 13, color: Color(0xFF8A90A2))),
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
                attributions: [
                  TextSourceAttribution('OpenStreetMap contributors'),
                ],
              ),
            ],
          ),
          if (_buses.isEmpty)
            const Positioned(
              left: 0,
              right: 0,
              bottom: 24,
              child: Center(child: _MapHint(text: 'No buses are on the road right now.')),
            ),
        ],
      ),
    );
  }
}

class _BusPin extends StatelessWidget {
  const _BusPin({required this.label, required this.colour, required this.onTap});

  final String label;
  final Color colour;
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
          border: Border.all(color: Colors.white, width: 2.5),
          boxShadow: const [BoxShadow(color: Color(0x55000000), blurRadius: 6, offset: Offset(0, 2))],
        ),
        child: const Icon(Icons.directions_bus_filled_rounded, color: Colors.white, size: 20),
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
