import '../models/transport_models.dart';
import 'api_service.dart';

/// Read-heavy REST calls shared by the student and driver flows: routes,
/// stops, schedules, live bus positions, favourites and trip history.
class TransportRepository {
  TransportRepository({ApiService? api}) : _api = api ?? ApiService();

  final ApiService _api;

  Future<List<BusRoute>> fetchRoutes({String? search}) async {
    final query = search != null && search.isNotEmpty ? '?search=$search' : '';
    final json = await _api.get('/routes$query') as List<dynamic>;
    return json.map((e) => BusRoute.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<BusRoute> fetchRoute(String id) async {
    final json = await _api.get('/routes/$id');
    return BusRoute.fromJson(json as Map<String, dynamic>);
  }

  Future<List<Schedule>> fetchSchedules(String routeId, {String? dayType}) async {
    final query = dayType != null ? '&dayType=$dayType' : '';
    final json = await _api.get('/schedules?routeId=$routeId$query') as List<dynamic>;
    return json.map((e) => Schedule.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<LiveBus>> fetchLiveBuses({String? routeId}) async {
    final query = routeId != null ? '?routeId=$routeId' : '';
    final json = await _api.get('/buses/live$query') as List<dynamic>;
    return json.map((e) => LiveBus.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ----- Favourites -----

  Future<List<BusRoute>> fetchFavouriteRoutes() async {
    final json = await _api.get('/students/me/favourites/routes') as List<dynamic>;
    return json
        .map((e) => BusRoute.fromJson((e as Map<String, dynamic>)['route'] as Map<String, dynamic>))
        .toList();
  }

  Future<void> addFavouriteRoute(String routeId) =>
      _api.post('/students/me/favourites/routes', {'routeId': routeId});

  Future<void> removeFavouriteRoute(String routeId) => _api.delete('/students/me/favourites/routes/$routeId');

  // ----- Trip history -----

  Future<List<TripHistoryEntry>> fetchTripHistory() async {
    final json = await _api.get('/students/me/trip-history') as List<dynamic>;
    return json.map((e) => TripHistoryEntry.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ----- Boarding -----

  Future<void> boardTrip(String tripId, {bool qrScanned = false}) =>
      _api.post('/trips/$tripId/board', {'qrScanned': qrScanned});

  Future<void> alightTrip(String tripId) => _api.post('/trips/$tripId/alight');

  /// Finds the trip currently in progress for a bus, if any - needed before
  /// boarding since the QR/boarding endpoint operates on a tripId, not a busId.
  Future<String?> fetchActiveTripId(String busId) async {
    final json = await _api.get('/trips?busId=$busId&status=IN_PROGRESS') as List<dynamic>;
    if (json.isEmpty) return null;
    return (json.first as Map<String, dynamic>)['id'] as String;
  }
}
