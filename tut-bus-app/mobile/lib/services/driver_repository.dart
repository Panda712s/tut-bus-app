import 'api_service.dart';
import '../models/user_models.dart';

/// Trip lifecycle + incident reporting for the driver flow.
class DriverRepository {
  DriverRepository({ApiService? api}) : _api = api ?? ApiService();

  final ApiService _api;

  Future<DriverProfile> fetchMyProfile() async {
    final json = await _api.get('/drivers/me');
    return DriverProfile.fromJson(json as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> startTrip({required String busId, required String routeId}) async {
    final json = await _api.post('/trips/start', {'busId': busId, 'routeId': routeId});
    return json as Map<String, dynamic>;
  }

  Future<void> pauseTrip(String tripId) => _api.post('/trips/$tripId/pause');
  Future<void> resumeTrip(String tripId) => _api.post('/trips/$tripId/resume');
  Future<void> endTrip(String tripId) => _api.post('/trips/$tripId/end');
  Future<void> cancelTrip(String tripId) => _api.post('/trips/$tripId/cancel');

  Future<void> updatePassengerCount(String busId, int passengerCount) =>
      _api.patch('/buses/$busId/passenger-count', {'passengerCount': passengerCount});

  Future<void> reportIncident({required String type, String? description, String? tripId}) => _api.post(
        '/drivers/me/incidents',
        {'type': type, if (description != null) 'description': description, if (tripId != null) 'tripId': tripId},
      );

  Future<List<Map<String, dynamic>>> fetchMyTrips({required String driverId, String? status}) async {
    final query = status != null ? '&status=$status' : '';
    final json = await _api.get('/trips?driverId=$driverId$query') as List<dynamic>;
    return json.cast<Map<String, dynamic>>();
  }
}
