import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../models/transport_models.dart';
import '../../services/api_exception.dart';
import '../../services/transport_repository.dart';
import '../../widgets/primary_button.dart';

/// QR Code Boarding (see doc section 6, "Student Features > QR Code
/// Boarding"): the driver's dashboard displays a QR code containing the
/// bus id; scanning it (or, here, simply confirming while on this screen)
/// records a TripHistory row on the backend for attendance and passenger
/// counting. A production build would replace the "Confirm boarding"
/// button with a camera scan via a package like `mobile_scanner`.
class BoardTripScreen extends StatefulWidget {
  const BoardTripScreen({super.key, required this.bus, required this.route});

  final LiveBus bus;
  final BusRoute route;

  @override
  State<BoardTripScreen> createState() => _BoardTripScreenState();
}

class _BoardTripScreenState extends State<BoardTripScreen> {
  final _repo = TransportRepository();
  bool _loading = false;
  bool _boarded = false;
  String? _tripId;
  String? _error;

  Future<void> _confirmBoarding() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final tripId = await _repo.fetchActiveTripId(widget.bus.id);
      if (tripId == null) {
        setState(() => _error = 'This bus does not have an active trip right now.');
        return;
      }
      await _repo.boardTrip(tripId, qrScanned: true);
      setState(() {
        _tripId = tripId;
        _boarded = true;
      });
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : 'Could not confirm boarding.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _alight() async {
    if (_tripId == null) return;
    setState(() => _loading = true);
    try {
      await _repo.alightTrip(_tripId!);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      setState(() => _error = e is ApiException ? e.message : 'Could not confirm alighting.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Board ${widget.bus.busNumber}')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            QrImageView(data: 'tutbus:${widget.bus.id}', size: 200),
            const SizedBox(height: 8),
            Text('${widget.route.name} · ${widget.bus.busNumber}', style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 24),
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 12),
            ],
            if (!_boarded)
              PrimaryButton(label: 'Confirm boarding', loading: _loading, onPressed: _confirmBoarding)
            else ...[
              const Icon(Icons.check_circle, color: Colors.green, size: 40),
              const SizedBox(height: 8),
              const Text('Boarding confirmed. Have a safe trip!'),
              const SizedBox(height: 16),
              PrimaryButton(label: "I've alighted", loading: _loading, color: const Color(0xFF262B3A), onPressed: _alight),
            ],
          ],
        ),
      ),
    );
  }
}
