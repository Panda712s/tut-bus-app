import 'package:flutter/foundation.dart';
import '../models/user_models.dart';
import '../services/auth_service.dart';

enum AuthStatus { unknown, signedOut, signedIn }

/// App-wide auth state. Wraps AuthService and notifies listeners so the
/// root widget can switch between the login flow and the signed-in shell.
class AuthState extends ChangeNotifier {
  AuthState({AuthService? authService}) : _authService = authService ?? AuthService() {
    _restore();
  }

  final AuthService _authService;

  AuthStatus status = AuthStatus.unknown;
  AuthUser? user;

  Future<void> _restore() async {
    final loggedIn = await _authService.isLoggedIn();
    if (loggedIn) {
      user = await _authService.currentUser();
      status = AuthStatus.signedIn;
    } else {
      status = AuthStatus.signedOut;
    }
    notifyListeners();
  }

  Future<void> signInStudent(String email, String password) async {
    final res = await _authService.loginStudent(email: email, password: password);
    user = res.user;
    status = AuthStatus.signedIn;
    notifyListeners();
  }

  Future<void> signInDriver(String email, String password) async {
    final res = await _authService.loginDriver(email: email, password: password);
    user = res.user;
    status = AuthStatus.signedIn;
    notifyListeners();
  }

  /// Registers a student. Returns true when the backend signed them straight
  /// in (email verification disabled); false when OTP verification is still
  /// required and the caller should show the verification screen.
  Future<bool> registerStudent({
    required String studentNumber,
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    final res = await _authService.registerStudent(
      studentNumber: studentNumber,
      fullName: fullName,
      email: email,
      password: password,
      phone: phone,
    );
    if (res.accessToken.isNotEmpty) {
      user = res.user;
      status = AuthStatus.signedIn;
      notifyListeners();
      return true;
    }
    return false;
  }

  Future<void> completeOtpVerification(String email, String code) async {
    final res = await _authService.verifyStudentOtp(email: email, code: code);
    user = res.user;
    status = AuthStatus.signedIn;
    notifyListeners();
  }

  Future<void> signOut() async {
    await _authService.logout();
    user = null;
    status = AuthStatus.signedOut;
    notifyListeners();
  }
}
