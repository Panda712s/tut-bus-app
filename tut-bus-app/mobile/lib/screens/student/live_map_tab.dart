import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../models/transport_models.dart';
import '../../services/socket_service.dart';
import '../../services/transport_repository.dart';
import '../../widgets/bus_pin.dart';
import '../../widgets/map_hint.dart';

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
      final merged = LiveBus.mergeLocationUpdate(incoming, _buses[incoming.id]);
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
          child: BusPin(
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
              child: Center(child: MapHint(text: 'No buses are on the road right now.')),
            ),
        ],
      ),
    );
  }
}

