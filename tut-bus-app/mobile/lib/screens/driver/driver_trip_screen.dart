import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../services/driver_repository.dart';
import '../../services/location_service.dart';
import '../../services/safety_repository.dart';
import '../../services/socket_service.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/rating_sheet.dart';
import '../../widgets/sos_button.dart';
import 'driver_incident_screen.dart';

class DriverTripScreen extends StatefulWidget {
  const DriverTripScreen({super.key, required this.trip, required this.busId});

  final Map<String, dynamic> trip;
  final String busId;

  @override
  State<DriverTripScreen> createState() => _DriverTripScreenState();
}

class _DriverTripScreenState extends State<DriverTripScreen> {
  final _driverRepo = DriverRepository();
  final _locationService = LocationService();
  final _gpsPublisher = DriverGpsPublisher();
  final _safety = SafetyRepository();

  late String _tripId = widget.trip['id'] as String;
  late String _status = widget.trip['status'] as String;
  int _passengerCount = 0;
  StreamSubscription<Position>? _positionSub;
  Timer? _statusTicker;
  Position? _lastPosition;
  bool _sharingLocation = false;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _startSharingIfPossible();
    // Keep the "queued pings" indicator fresh while offline.
    _statusTicker = Timer.periodic(const Duration(seconds: 3), (_) {
      if (mounted) setState(() {});
    });
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
    });
  }

  @override
  void dispose() {
    _statusTicker?.cancel();
    _positionSub?.cancel();
    _gpsPublisher.dispose();
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

  @override
  Widget build(BuildContext context) {
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
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          _sharingLocation ? Icons.gps_fixed_rounded : Icons.gps_off_rounded,
                          color: _sharingLocation ? Colors.green : Colors.red,
                        ),
                        const SizedBox(width: 8),
                        Text(_sharingLocation ? 'Sharing live location' : 'Location not shared'),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text('Trip status: $_status', style: const TextStyle(fontWeight: FontWeight.w600)),
                    if (_lastPosition != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          'Last fix: ${_lastPosition!.latitude.toStringAsFixed(5)}, ${_lastPosition!.longitude.toStringAsFixed(5)}',
                          style: const TextStyle(fontSize: 12, color: Colors.white70),
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
            ),
            const SizedBox(height: 20),
            const Text('Passenger count', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton.filledTonal(onPressed: () => _updatePassengers(-1), icon: const Icon(Icons.remove)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Text('$_passengerCount', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                ),
                IconButton.filledTonal(onPressed: () => _updatePassengers(1), icon: const Icon(Icons.add)),
              ],
            ),
            const SizedBox(height: 24),
            if (_status == 'IN_PROGRESS')
              PrimaryButton(label: 'Pause trip', loading: _busy, color: Colors.orange, onPressed: _pause)
            else if (_status == 'PAUSED')
              PrimaryButton(label: 'Resume trip', loading: _busy, onPressed: _resume),
            const SizedBox(height: 10),
            PrimaryButton(label: 'End trip', loading: _busy, color: const Color(0xFF262B3A), onPressed: _end),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => DriverIncidentScreen(tripId: _tripId)),
              ),
              icon: const Icon(Icons.warning_amber_rounded, color: Colors.red),
              label: const Text('Report traffic / accident / breakdown', style: TextStyle(color: Colors.red)),
            ),
          ],
        ),
      ),
    );
  }
}
