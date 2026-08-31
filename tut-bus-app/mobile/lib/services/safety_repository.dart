import 'api_service.dart';

/// SOS alerts and shareable "watch my trip" links (feature: safety).
class SafetyRepository {
  SafetyRepository({ApiService? api}) : _api = api ?? ApiService();

  final ApiService _api;

  /// Raise an SOS. Campus security / admins are alerted in real time.
  Future<void> raiseSos({double? lat, double? lng, String? note, String? tripId}) => _api.post('/safety/sos', {
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
        if (note != null && note.isNotEmpty) 'note': note,
        if (tripId != null) 'tripId': tripId,
      });

  /// Create a public link a friend can open to watch the trip until it expires.
  Future<TripShareLink> createShare({required String tripId, int hours = 2}) async {
    final json = await _api.post('/safety/shares', {'tripId': tripId, 'hours': hours});
    return TripShareLink.fromJson(json as Map<String, dynamic>);
  }

  Future<void> revokeShare(String id) => _api.delete('/safety/shares/$id');
}

class TripShareLink {
  TripShareLink({required this.id, required this.token, required this.path, required this.expiresAt});

  final String id;
  final String token;
  final String path;
  final DateTime expiresAt;

  factory TripShareLink.fromJson(Map<String, dynamic> j) => TripShareLink(
        id: j['id'] as String,
        token: j['token'] as String,
        path: j['path'] as String,
        expiresAt: DateTime.tryParse(j['expiresAt'] as String? ?? '') ?? DateTime.now(),
      );
}
