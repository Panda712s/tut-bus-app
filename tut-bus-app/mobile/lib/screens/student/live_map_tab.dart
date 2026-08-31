import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../models/transport_models.dart';
import '../../services/socket_service.dart';
import '../../services/transport_repository.dart';

// Default camera position centred on the TUT Pretoria campus area.
const _defaultCenter = CameraPosition(target: LatLng(-25.7461, 28.1881), zoom: 12.5);

class LiveMapTab extends StatefulWidget {
  const LiveMapTab({super.key});

  @override
  State<LiveMapTab> createState() => _LiveMapTabState();
}

class _LiveMapTabState extends State<LiveMapTab> {
  final _gpsSocket = GpsSocketService();
  final _transportRepo = TransportRepository();
  final Map<String, LiveBus> _buses = {};
  GoogleMapController? _mapController;

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
      // The socket payload doesn't include the bus's total seating capacity,
      // so keep whatever the initial REST fetch already told us.
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
    super.dispose();
  }

  Set<Marker> get _markers => _buses.values
      .where((b) => b.lat != null && b.lng != null)
      .map(
        (b) => Marker(
          markerId: MarkerId(b.id),
          position: LatLng(b.lat!, b.lng!),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            b.capacityState == CapacityState.full
                ? BitmapDescriptor.hueRed
                : b.capacityState == CapacityState.moderate
                    ? BitmapDescriptor.hueOrange
                    : BitmapDescriptor.hueGreen,
          ),
          infoWindow: InfoWindow(
            title: b.busNumber,
            snippet: '${b.passengerCount}/${b.capacity} passengers'
                '${b.speedKmh != null ? " · ${b.speedKmh!.toStringAsFixed(0)} km/h" : ""}',
          ),
        ),
      )
      .toSet();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Live Bus Tracking')),
      body: GoogleMap(
        initialCameraPosition: _defaultCenter,
        markers: _markers,
        myLocationButtonEnabled: false,
        onMapCreated: (controller) => _mapController = controller,
      ),
    );
  }
}
