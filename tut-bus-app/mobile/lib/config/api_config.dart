/// Central place to point the app at your backend.
///
/// - Android emulator reaching a backend on your host machine: use 10.0.2.2
/// - iOS simulator: localhost works
/// - Physical device: use your computer's LAN IP (e.g. 192.168.x.x)
class ApiConfig {
  ApiConfig._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );

  static const String socketUrl = String.fromEnvironment(
    'SOCKET_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// Set this via --dart-define=GOOGLE_MAPS_API_KEY=your_key when building,
  /// or configure it natively in AndroidManifest.xml / AppDelegate.swift
  /// (see mobile/README.md).
  static const String googleMapsApiKey = String.fromEnvironment('GOOGLE_MAPS_API_KEY');
}
