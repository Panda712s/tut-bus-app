import '../models/user_models.dart';
import 'api_service.dart';

class StudentRepository {
  StudentRepository({ApiService? api}) : _api = api ?? ApiService();

  final ApiService _api;

  Future<StudentProfile> fetchMyProfile() async {
    final json = await _api.get('/students/me');
    return StudentProfile.fromJson(json as Map<String, dynamic>);
  }

  Future<void> updateMyProfile({String? fullName, String? phone}) {
    return _api.patch('/students/me', {
      if (fullName != null) 'fullName': fullName,
      if (phone != null) 'phone': phone,
    });
  }
}
