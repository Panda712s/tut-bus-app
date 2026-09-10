import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Persists the last-used sign-in email and password for a role so the login
/// screen can pre-fill them after the user signs out. Only written when the
/// user ticks "Remember my details"; cleared as soon as they untick it.
///
/// The password is base64-wrapped rather than stored as raw text so it is not
/// legible at a glance in a prefs inspector. This is obfuscation, not
/// encryption - for a real deployment this should move to
/// `flutter_secure_storage` (Keychain / Keystore), the same hardening note
/// that applies to [TokenStorage].
class RememberedCredentials {
  static const _prefix = 'tutbus_remember_';

  String _key(String role) => '$_prefix$role';

  Future<void> save({
    required String role,
    required String email,
    required String password,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final payload = jsonEncode({
      'email': email,
      'password': base64Encode(utf8.encode(password)),
    });
    await prefs.setString(_key(role), payload);
  }

  Future<RememberedLogin?> load(String role) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key(role));
    if (raw == null || raw.isEmpty) return null;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final email = map['email'] as String? ?? '';
      final encoded = map['password'] as String? ?? '';
      final password = encoded.isEmpty ? '' : utf8.decode(base64Decode(encoded));
      if (email.isEmpty) return null;
      return RememberedLogin(email: email, password: password);
    } catch (_) {
      await prefs.remove(_key(role));
      return null;
    }
  }

  Future<void> clear(String role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key(role));
  }
}

class RememberedLogin {
  const RememberedLogin({required this.email, required this.password});

  final String email;
  final String password;
}
