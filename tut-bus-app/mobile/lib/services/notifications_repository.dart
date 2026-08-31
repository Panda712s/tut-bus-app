import '../models/transport_models.dart';
import 'api_service.dart';

class NotificationsRepository {
  NotificationsRepository({ApiService? api}) : _api = api ?? ApiService();

  final ApiService _api;

  Future<List<AppNotification>> fetchMine() async {
    final json = await _api.get('/notifications/me') as List<dynamic>;
    return json.map((e) => AppNotification.fromRecipientJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> markRead(String recipientId) => _api.patch('/notifications/$recipientId/read');
}
