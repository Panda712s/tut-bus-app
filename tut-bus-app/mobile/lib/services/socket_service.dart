import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/api_config.dart';
import 'token_storage.dart';

/// Read-only GPS channel for student clients: listens for `bus:location`
/// broadcasts. See DriverGpsPublisher (driver flow) for the publishing side.
class GpsSocketService {
  io.Socket? _socket;

  io.Socket connect() {
    _socket ??= io.io(
      '${ApiConfig.socketUrl}/gps',
      io.OptionBuilder().setTransports(['websocket']).disableAutoConnect().build(),
    );
    if (_socket!.disconnected) {
      _socket!.connect();
    }
    return _socket!;
  }

  void subscribeToRoute(String routeId) {
    _socket?.emit('gps:subscribe-route', routeId);
  }

  void onBusLocation(void Function(Map<String, dynamic> data) handler) {
    _socket?.on('bus:location', (data) => handler(Map<String, dynamic>.from(data as Map)));
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }
}

/// Notification channel: joins the caller's personal + role room so it
/// receives targeted and broadcast pushes in real time.
class NotificationsSocketService {
  NotificationsSocketService({TokenStorage? tokenStorage}) : _tokenStorage = tokenStorage ?? TokenStorage();

  final TokenStorage _tokenStorage;
  io.Socket? _socket;

  Future<io.Socket> connect({required String userId, required String role}) async {
    _socket ??= io.io(
      '${ApiConfig.socketUrl}/notifications',
      io.OptionBuilder().setTransports(['websocket']).disableAutoConnect().build(),
    );
    if (_socket!.disconnected) {
      _socket!.onConnect((_) => _socket!.emit('identify', {'userId': userId, 'role': role}));
      _socket!.connect();
    }
    return _socket!;
  }

  void onNewNotification(void Function(Map<String, dynamic> data) handler) {
    _socket?.on('notification:new', (data) => handler(Map<String, dynamic>.from(data as Map)));
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }
}

/// Publishing side, used only by the driver app while a trip is active.
/// Connects with the driver's JWT so the backend can attribute GPS pings.
class DriverGpsPublisher {
  DriverGpsPublisher({TokenStorage? tokenStorage}) : _tokenStorage = tokenStorage ?? TokenStorage();

  final TokenStorage _tokenStorage;
  io.Socket? _socket;

  Future<io.Socket> connect() async {
    final token = await _tokenStorage.getAccessToken();
    _socket ??= io.io(
      '${ApiConfig.socketUrl}/gps',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .build(),
    );
    if (_socket!.disconnected) {
      _socket!.connect();
    }
    return _socket!;
  }

  void publish({
    required String busId,
    String? tripId,
    required double lat,
    required double lng,
    double? speedKmh,
    double? heading,
  }) {
    _socket?.emit('gps:update', {
      'busId': busId,
      if (tripId != null) 'tripId': tripId,
      'lat': lat,
      'lng': lng,
      if (speedKmh != null) 'speedKmh': speedKmh,
      if (heading != null) 'heading': heading,
    });
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }
}
