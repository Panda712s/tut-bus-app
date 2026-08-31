import 'dart:convert';
import '../models/user_models.dart';
import 'api_service.dart';
import 'token_storage.dart';

class AuthService {
  AuthService({ApiService? api, TokenStorage? tokenStorage})
      : _api = api ?? ApiService(),
        _tokenStorage = tokenStorage ?? TokenStorage();

  final ApiService _api;
  final TokenStorage _tokenStorage;

  Future<AuthResponse> registerStudent({
    required String studentNumber,
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    await _api.post('/auth/student/register', {
      'studentNumber': studentNumber,
      'fullName': fullName,
      'email': email,
      'password': password,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
    });
    // Registration returns a message + studentId; the caller navigates to OTP verification next.
    return Future.value(
      AuthResponse(accessToken: '', refreshToken: '', user: AuthUser(id: '', email: email, role: AppRole.student)),
    );
  }

  Future<AuthResponse> verifyStudentOtp({required String email, required String code}) async {
    final json = await _api.post('/auth/student/verify-otp', {'email': email, 'code': code});
    final response = AuthResponse.fromJson(json as Map<String, dynamic>);
    await _persist(response);
    return response;
  }

  Future<AuthResponse> loginStudent({required String email, required String password}) async {
    final json = await _api.post('/auth/student/login', {'email': email, 'password': password});
    final response = AuthResponse.fromJson(json as Map<String, dynamic>);
    await _persist(response);
    return response;
  }

  Future<AuthResponse> loginDriver({required String email, required String password}) async {
    final json = await _api.post('/auth/driver/login', {'email': email, 'password': password});
    final response = AuthResponse.fromJson(json as Map<String, dynamic>);
    await _persist(response);
    return response;
  }

  Future<void> requestStudentPasswordReset(String email) {
    return _api.post('/auth/student/request-password-reset', {'email': email});
  }

  Future<void> resetStudentPassword({required String email, required String code, required String newPassword}) {
    return _api.post('/auth/student/reset-password', {'email': email, 'code': code, 'newPassword': newPassword});
  }

  Future<void> _persist(AuthResponse response) async {
    await _tokenStorage.saveTokens(accessToken: response.accessToken, refreshToken: response.refreshToken);
    await _tokenStorage.saveUserJson(jsonEncode(response.user.toJson()));
  }

  Future<AuthUser?> currentUser() async {
    final json = await _tokenStorage.getUserJson();
    if (json == null) return null;
    return AuthUser.fromJson(jsonDecode(json) as Map<String, dynamic>);
  }

  Future<bool> isLoggedIn() async {
    final token = await _tokenStorage.getAccessToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> logout() => _tokenStorage.clear();
}
