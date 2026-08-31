import 'api_service.dart';

/// Live arrival estimates. Backed by the public `/eta/*` endpoints, so it
/// works whether or not the caller is signed in.
class EtaRepository {
  EtaRepository({ApiService? api}) : _api = api ?? ApiService();

  final ApiService _api;

  Future<List<RouteEtaBus>> forRoute(String routeId) async {
    final json = await _api.get('/eta/route/$routeId') as List<dynamic>;
    return json.map((e) => RouteEtaBus.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<StopEta> forStop(String stopId) async {
    final json = await _api.get('/eta/stop/$stopId');
    return StopEta.fromJson(json as Map<String, dynamic>);
  }
}

class RouteEtaBus {
  RouteEtaBus({
    required this.busId,
    required this.busNumber,
    required this.capacityState,
    required this.passengerCount,
    required this.stops,
  });

  final String busId;
  final String busNumber;
  final String capacityState;
  final int passengerCount;
  final List<StopEtaEntry> stops;

  factory RouteEtaBus.fromJson(Map<String, dynamic> j) => RouteEtaBus(
        busId: j['busId'] as String,
        busNumber: j['busNumber'] as String,
        capacityState: j['capacityState'] as String? ?? 'EMPTY',
        passengerCount: (j['passengerCount'] as num?)?.toInt() ?? 0,
        stops: ((j['stops'] as List<dynamic>?) ?? [])
            .map((e) => StopEtaEntry.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class StopEtaEntry {
  StopEtaEntry({
    required this.stopId,
    required this.stopName,
    required this.distanceMeters,
    required this.etaSeconds,
    required this.etaAt,
  });

  final String stopId;
  final String stopName;
  final int distanceMeters;
  final int etaSeconds;
  final DateTime etaAt;

  String get label {
    if (etaSeconds < 45) return 'now';
    final mins = (etaSeconds / 60).round();
    if (mins < 60) return '$mins min';
    final h = mins ~/ 60;
    final m = mins % 60;
    return m == 0 ? '${h}h' : '${h}h ${m}m';
  }

  factory StopEtaEntry.fromJson(Map<String, dynamic> j) => StopEtaEntry(
        stopId: j['stopId'] as String,
        stopName: j['stopName'] as String,
        distanceMeters: (j['distanceMeters'] as num?)?.toInt() ?? 0,
        etaSeconds: (j['etaSeconds'] as num?)?.toInt() ?? 0,
        etaAt: DateTime.tryParse(j['etaAt'] as String? ?? '') ?? DateTime.now(),
      );
}

class StopEta {
  StopEta({required this.stopId, required this.stopName, required this.arrivals});

  final String stopId;
  final String stopName;
  final List<StopArrival> arrivals;

  factory StopEta.fromJson(Map<String, dynamic> j) => StopEta(
        stopId: j['stopId'] as String,
        stopName: j['stopName'] as String,
        arrivals: ((j['arrivals'] as List<dynamic>?) ?? [])
            .map((e) => StopArrival.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class StopArrival {
  StopArrival({
    required this.busNumber,
    required this.capacityState,
    required this.etaSeconds,
    required this.etaAt,
  });

  final String busNumber;
  final String capacityState;
  final int etaSeconds;
  final DateTime etaAt;

  String get label {
    if (etaSeconds < 45) return 'now';
    final mins = (etaSeconds / 60).round();
    return mins < 60 ? '$mins min' : '${mins ~/ 60}h ${mins % 60}m';
  }

  factory StopArrival.fromJson(Map<String, dynamic> j) => StopArrival(
        busNumber: j['busNumber'] as String,
        capacityState: j['capacityState'] as String? ?? 'EMPTY',
        etaSeconds: (j['etaSeconds'] as num?)?.toInt() ?? 0,
        etaAt: DateTime.tryParse(j['etaAt'] as String? ?? '') ?? DateTime.now(),
      );
}
