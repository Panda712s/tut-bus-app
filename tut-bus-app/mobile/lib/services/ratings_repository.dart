import 'api_service.dart';

/// Two-way structured trip ratings and the post-trip receipt.
class RatingsRepository {
  RatingsRepository({ApiService? api}) : _api = api ?? ApiService();

  final ApiService _api;

  /// The chip options each role may attach, so the rating sheet can render them.
  Future<RatingTags> fetchTags() async {
    final json = await _api.get('/ratings/tags') as Map<String, dynamic>;
    return RatingTags(
      studentToDriver: (json['studentToDriver'] as List<dynamic>).cast<String>(),
      driverToTrip: (json['driverToTrip'] as List<dynamic>).cast<String>(),
    );
  }

  Future<void> submit({
    required String tripId,
    required int score,
    List<String> tags = const [],
    String? comment,
  }) =>
      _api.post('/ratings', {
        'tripId': tripId,
        'score': score,
        if (tags.isNotEmpty) 'tags': tags,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
      });

  Future<TripReceipt> receipt(String tripId) async {
    final json = await _api.get('/ratings/trip/$tripId/receipt');
    return TripReceipt.fromJson(json as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> driverSummary(String driverId) async {
    final json = await _api.get('/ratings/driver/$driverId/summary');
    return json as Map<String, dynamic>;
  }
}

class RatingTags {
  RatingTags({required this.studentToDriver, required this.driverToTrip});
  final List<String> studentToDriver;
  final List<String> driverToTrip;
}

class TripReceipt {
  TripReceipt({
    required this.tripId,
    required this.routeName,
    required this.busNumber,
    required this.driverName,
    required this.durationMinutes,
    required this.distanceKm,
    required this.boardings,
    required this.stopsServed,
    required this.riderRatingAverage,
    required this.riderRatingCount,
  });

  final String tripId;
  final String routeName;
  final String busNumber;
  final String driverName;
  final int? durationMinutes;
  final double distanceKm;
  final int boardings;
  final List<String> stopsServed;
  final double? riderRatingAverage;
  final int riderRatingCount;

  factory TripReceipt.fromJson(Map<String, dynamic> j) {
    final route = j['route'] as Map<String, dynamic>?;
    final bus = j['bus'] as Map<String, dynamic>?;
    final driver = j['driver'] as Map<String, dynamic>?;
    return TripReceipt(
      tripId: j['tripId'] as String,
      routeName: route?['name'] as String? ?? 'Trip',
      busNumber: bus?['busNumber'] as String? ?? '',
      driverName: driver?['name'] as String? ?? '',
      durationMinutes: (j['durationMinutes'] as num?)?.toInt(),
      distanceKm: (j['distanceKm'] as num?)?.toDouble() ?? 0,
      boardings: (j['boardings'] as num?)?.toInt() ?? 0,
      stopsServed: ((j['stopsServed'] as List<dynamic>?) ?? [])
          .map((e) => (e as Map<String, dynamic>)['name'] as String)
          .toList(),
      riderRatingAverage: (j['riderRatingAverage'] as num?)?.toDouble(),
      riderRatingCount: (j['riderRatingCount'] as num?)?.toInt() ?? 0,
    );
  }
}
