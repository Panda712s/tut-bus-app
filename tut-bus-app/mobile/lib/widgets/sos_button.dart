import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../services/safety_repository.dart';

/// A small red "SOS" pill. Long-press or confirm to raise an alert; the
/// rider's current location is attached automatically when available.
class SosButton extends StatefulWidget {
  const SosButton({super.key, this.tripId, this.compact = false});

  final String? tripId;
  final bool compact;

  @override
  State<SosButton> createState() => _SosButtonState();
}

class _SosButtonState extends State<SosButton> {
  final _safety = SafetyRepository();
  bool _sending = false;

  Future<void> _confirmAndSend() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.sos_rounded, color: Color(0xFFDC2626), size: 32),
        title: const Text('Send an SOS?'),
        content: const Text(
          'Campus security and administrators will be alerted immediately, '
          'along with your current location. Use this only in a real emergency.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Send SOS'),
          ),
        ],
      ),
    );
    if (ok != true) return;

    setState(() => _sending = true);
    double? lat;
    double? lng;
    try {
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      ).timeout(const Duration(seconds: 5));
      lat = pos.latitude;
      lng = pos.longitude;
    } catch (_) {
      // location is best-effort - still send the alert without it
    }

    try {
      await _safety.raiseSos(lat: lat, lng: lng, tripId: widget.tripId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF15803D),
            content: Text('SOS sent. Help has been alerted.'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: const Color(0xFFDC2626), content: Text('Could not send SOS: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final child = _sending
        ? const SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.sos_rounded, size: 18, color: Colors.white),
              SizedBox(width: 6),
              Text('SOS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
            ],
          );

    return Material(
      color: const Color(0xFFDC2626),
      shape: const StadiumBorder(),
      elevation: 3,
      shadowColor: const Color(0x55DC2626),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: _sending ? null : _confirmAndSend,
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: widget.compact ? 14 : 18, vertical: widget.compact ? 8 : 10),
          child: child,
        ),
      ),
    );
  }
}
