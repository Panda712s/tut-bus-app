import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../../models/transport_models.dart';
import '../../services/driver_repository.dart';
import '../../services/eta_repository.dart';
import '../../services/location_service.dart';
import '../../services/safety_repository.dart';
import '../../services/socket_service.dart';
import '../../services/transport_repository.dart';
import '../../widgets/animated_map_controller.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/rating_sheet.dart';
import '../../widgets/sos_button.dart';
import '../../widgets/upcoming_stops_card.dart';
import 'driver_incident_screen.dart';

const _accent = Color(0xFF0A5796);
const _muted = Color(0xFF8A90A2);
const _defaultCenter = LatLng(-25.7461, 28.1881);

class DriverTripScreen extends StatefulWidget {
  const DriverTripScreen({super.key, required this.trip, required this.busId});

  final Map<String, dynamic> trip;
  final String busId;

  @override
  State<DriverTripScreen> createState() => _DriverTripScreenState();
}

class _DriverTripScreenState extends State<DriverTripScreen> with SingleTickerProviderStateMixin {
  final _driverRepo = DriverRepository();
  final _locationService = LocationService();
  final _gpsPublisher = DriverGpsPublisher();
  final _safety = SafetyRepository();
  final _transportRepo = TransportRepository();
  final _etaRepo = EtaRepository();
  final _mapController = MapController();
  late final _animatedMap = AnimatedMapController(mapController: _mapController, vsync: this);

  late final String _tripId = widget.trip['id'] as String;
  late final String? _routeId =
      widget.trip['routeId'] as String? ?? (widget.trip['route'] as Map?)?['id'] as String?;
  late String _status = widget.trip['status'] as String;
  int _passengerCount = 0;
  StreamSubscription<Position>? _positionSub;
  Timer? _statusTicker;
  Timer? _etaTicker;
  Position? _lastPosition;
  bool _sharingLocation = false;
  bool _busy = false;
  List<BusStop> _stops = [];
  List<StopEtaEntry> _upcomingStops = [];
  bool _loadingEta = true;
  bool _mapFollows = true;

  @override
  void initState() {
    super.initState();
    _startSharingIfPossible();
    _loadRoute();
    _loadEta();
    // Keep the "queued pings" indicator fresh while offline.
    _statusTicker = Timer.periodic(const Duration(seconds: 3), (_) {
      if (mounted) setState(() {});
    });
    // Refresh how-far-to-each-stop periodically as the bus moves along the route.
    _etaTicker = Timer.periodic(const Duration(seconds: 20), (_) => _loadEta());
  }

  Future<void> _loadRoute() async {
    if (_routeId == null) return;
    try {
      final route = await _transportRepo.fetchRoute(_routeId);
      if (mounted) setState(() => _stops = route.stops);
    } catch (_) {
      // The trip still works without the stop overlay on the map.
    }
  }

  Future<void> _loadEta() async {
    if (_routeId == null) return;
    try {
      final buses = await _etaRepo.forRoute(_routeId);
      final mine = buses.where((b) => b.busId == widget.busId);
      if (mounted) setState(() => _upcomingStops = mine.isNotEmpty ? mine.first.stops : []);
    } catch (_) {
      // Non-fatal - the map and trip controls still work without ETAs.
    } finally {
      if (mounted) setState(() => _loadingEta = false);
    }
  }

  Future<void> _startSharingIfPossible() async {
    final granted = await _locationService.ensurePermission();
    if (!granted) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Location permission is required to share your position with students.')),
        );
      }
      return;
    }
    await _gpsPublisher.connect();
    setState(() => _sharingLocation = true);
    _positionSub = _locationService.positionStream().listen((position) {
      _lastPosition = position;
      _gpsPublisher.publish(
        busId: widget.busId,
        tripId: _tripId,
        lat: position.latitude,
        lng: position.longitude,
        speedKmh: position.speed * 3.6,
        heading: position.heading,
      );
      if (mounted) setState(() {});
      if (_mapFollows) {
        _animatedMap.animateTo(
          dest: LatLng(position.latitude, position.longitude),
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _statusTicker?.cancel();
    _etaTicker?.cancel();
    _positionSub?.cancel();
    _gpsPublisher.dispose();
    _animatedMap.dispose();
    _mapController.dispose();
    super.dispose();
  }

  Future<void> _pause() => _runAction(() => _driverRepo.pauseTrip(_tripId), newStatus: 'PAUSED');
  Future<void> _resume() => _runAction(() => _driverRepo.resumeTrip(_tripId), newStatus: 'IN_PROGRESS');

  Future<void> _end() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('End trip?'),
        content: const Text('This will stop live tracking for this trip.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('End trip')),
        ],
      ),
    );
    if (confirmed != true) return;
    await _runAction(() => _driverRepo.endTrip(_tripId), newStatus: 'COMPLETED');
    if (!mounted) return;
    await showRatingSheet(context, tripId: _tripId, isDriver: true);
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _shareTrip() async {
    try {
      final link = await _safety.createShare(tripId: _tripId);
      if (!mounted) return;
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Trip link created'),
          content: Text(
            'Anyone with this link can follow the bus until it expires '
            '(${TimeOfDay.fromDateTime(link.expiresAt).format(ctx)}).\n\n${link.path}',
          ),
          actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Done'))],
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not create link: $e')));
      }
    }
  }

  Future<void> _runAction(Future<void> Function() action, {required String newStatus}) async {
    setState(() => _busy = true);
    try {
      await action();
      setState(() => _status = newStatus);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Action failed: $e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _updatePassengers(int delta) async {
    final next = (_passengerCount + delta).clamp(0, 999);
    setState(() => _passengerCount = next);
    try {
      await _driverRepo.updatePassengerCount(widget.busId, next);
    } catch (_) {
      // Non-fatal - local count already reflects the change.
    }
  }

  List<Marker> get _stopMarkers => _stops
      .map((s) => Marker(
            point: LatLng(s.lat, s.lng),
            width: 22,
            height: 22,
            child: Container(
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: const Color(0xFFFAB416),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
                boxShadow: const [BoxShadow(color: Color(0x40000000), blurRadius: 4, offset: Offset(0, 1))],
              ),
            ),
          ))
      .toList();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final me = _lastPosition != null ? LatLng(_lastPosition!.latitude, _lastPosition!.longitude) : null;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Active Trip'),
        actions: [
          IconButton(
            tooltip: 'Share this trip',
            onPressed: _shareTrip,
            icon: const Icon(Icons.ios_share_rounded),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: SosButton(tripId: _tripId, compact: true),
          ),
        ],
      ),
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          // Live road map - centres and follows the driver's own GPS fix so
          // the road ahead stays in view, with route stops marked in gold.
          SizedBox(
            height: 260,
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: me ?? _defaultCenter,
                    initialZoom: 15,
                    minZoom: 4,
                    maxZoom: 18,
                    onPositionChanged: (_, hasGesture) {
                      if (hasGesture && _mapFollows) setState(() => _mapFollows = false);
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'za.ac.tut.tut_bus_app',
                      maxZoom: 19,
                    ),
                    if (_stops.length >= 2)
                      PolylineLayer(polylines: [
                        Polyline(
                          points: _stops.map((s) => LatLng(s.lat, s.lng)).toList(),
                          strokeWidth: 4,
                          color: const Color(0xB30A5796),
                        ),
                      ]),
                    MarkerLayer(markers: _stopMarkers),
                    if (me != null)
                      MarkerLayer(markers: [
                        Marker(
                          point: me,
                          width: 40,
                          height: 40,
                          child: Container(
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: _accent,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 3),
                              boxShadow: const [BoxShadow(color: Color(0x550A5796), blurRadius: 10, offset: Offset(0, 3))],
                            ),
                            child: const Icon(Icons.navigation_rounded, color: Colors.white, size: 18),
                          ),
                        ),
                      ]),
                    const RichAttributionWidget(
                      attributions: [TextSourceAttribution('OpenStreetMap contributors')],
                    ),
                  ],
                ),
                Positioned(
                  right: 12,
                  bottom: 12,
                  child: AnimatedSlide(
                    duration: const Duration(milliseconds: 220),
                    curve: Curves.easeOut,
                    offset: _mapFollows ? const Offset(0, 1.4) : Offset.zero,
                    child: AnimatedOpacity(
                      duration: const Duration(milliseconds: 220),
                      opacity: _mapFollows ? 0 : 1,
                      child: IgnorePointer(
                        ignoring: _mapFollows,
                        child: FloatingActionButton.small(
                          heroTag: 'driver-trip-recentre',
                          onPressed: () {
                            setState(() => _mapFollows = true);
                            if (me != null) _animatedMap.animateTo(dest: me, zoom: 15);
                          },
                          backgroundColor: Colors.white,
                          foregroundColor: _accent,
                          child: const Icon(Icons.my_location_rounded),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.cardColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: theme.dividerColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 300),
                            transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
                            child: Icon(
                              _sharingLocation ? Icons.gps_fixed_rounded : Icons.gps_off_rounded,
                              key: ValueKey(_sharingLocation),
                              color: _sharingLocation ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 8),
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 250),
                            child: Text(
                              _sharingLocation ? 'Sharing live location' : 'Location not shared',
                              key: ValueKey(_sharingLocation),
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('Trip status: ${_status.replaceAll('_', ' ')}',
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
                      if (_lastPosition != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            'Last fix: ${_lastPosition!.latitude.toStringAsFixed(5)}, ${_lastPosition!.longitude.toStringAsFixed(5)}',
                            style: const TextStyle(fontSize: 12, color: _muted),
                          ),
                        ),
                      if (_gpsPublisher.pendingCount > 0)
                        Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Row(
                            children: [
                              const Icon(Icons.cloud_off_rounded, size: 16, color: Color(0xFFB45309)),
                              const SizedBox(width: 6),
                              Text(
                                '${_gpsPublisher.pendingCount} fixes queued — will sync when back online',
                                style: const TextStyle(fontSize: 12, color: Color(0xFFB45309)),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                UpcomingStopsCard(loading: _loadingEta, stops: _upcomingStops),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: theme.cardColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: theme.dividerColor),
                  ),
                  child: Column(
                    children: [
                      const Text('Passenger count', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          IconButton.filledTonal(onPressed: () => _updatePassengers(-1), icon: const Icon(Icons.remove)),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 22),
                            child: AnimatedSwitcher(
                              duration: const Duration(milliseconds: 200),
                              transitionBuilder: (child, anim) => ScaleTransition(
                                scale: anim,
                                child: FadeTransition(opacity: anim, child: child),
                              ),
                              child: Text(
                                '$_passengerCount',
                                key: ValueKey(_passengerCount),
                                style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
                              ),
                            ),
                          ),
                          IconButton.filledTonal(onPressed: () => _updatePassengers(1), icon: const Icon(Icons.add)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  transitionBuilder: (child, anim) => FadeTransition(
                    opacity: anim,
                    child: SizeTransition(sizeFactor: anim, child: child),
                  ),
                  child: _status == 'IN_PROGRESS'
                      ? PrimaryButton(
                          key: const ValueKey('pause'),
                          label: 'Pause trip',
                          loading: _busy,
                          color: const Color(0xFFF59E0B),
                          onPressed: _pause,
                        )
                      : _status == 'PAUSED'
                          ? PrimaryButton(
                              key: const ValueKey('resume'),
                              label: 'Resume trip',
                              loading: _busy,
                              onPressed: _resume,
                            )
                          : const SizedBox.shrink(key: ValueKey('none')),
                ),
                const SizedBox(height: 10),
                PrimaryButton(label: 'End trip', loading: _busy, color: const Color(0xFF262B3A), onPressed: _end),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => DriverIncidentScreen(tripId: _tripId)),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFDC2626),
                    side: const BorderSide(color: Color(0x40DC2626)),
                  ),
                  icon: const Icon(Icons.warning_amber_rounded),
                  label: const Text('Report traffic / accident / breakdown'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
