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

  // ignore: unused_field
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

  /// Fired when the bus the rider is watching reaches one of the route's
  /// stops (geofenced arrival) - drives the "arriving now" banner.
  void onStopArrival(void Function(Map<String, dynamic> data) handler) {
    _socket?.on('stop:arrival', (data) => handler(Map<String, dynamic>.from(data as Map)));
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }
}

/// Publishing side, used only by the driver app while a trip is active.
/// Connects with the driver's JWT so the backend can attribute GPS pings.
///
/// If the socket is offline when [publish] is called, the ping is buffered
/// locally (each stamped with its own `recordedAt`) and the whole queue is
/// flushed with a single `gps:flush` the moment the connection returns -
/// so the live map never "teleports" after a signal drop.
class DriverGpsPublisher {
  DriverGpsPublisher({TokenStorage? tokenStorage}) : _tokenStorage = tokenStorage ?? TokenStorage();

  final TokenStorage _tokenStorage;
  io.Socket? _socket;

  static const int _maxBuffered = 500;
  final List<Map<String, dynamic>> _pending = [];
  bool _connected = false;

  int get pendingCount => _pending.length;
  bool get isConnected => _connected;

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
    _socket!
      ..onConnect((_) {
        _connected = true;
        _flush();
      })
      ..onDisconnect((_) => _connected = false);

    if (_socket!.disconnected) {
      _socket!.connect();
    } else {
      _connected = _socket!.connected;
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
    final ping = <String, dynamic>{
      'busId': busId,
      if (tripId != null) 'tripId': tripId,
      'lat': lat,
      'lng': lng,
      if (speedKmh != null) 'speedKmh': speedKmh,
      if (heading != null) 'heading': heading,
      'recordedAt': DateTime.now().toUtc().toIso8601String(),
    };

    if (_connected && _socket != null) {
      _socket!.emit('gps:update', ping);
    } else {
      _pending.add(ping);
      if (_pending.length > _maxBuffered) {
        _pending.removeRange(0, _pending.length - _maxBuffered);
      }
    }
  }

  void _flush() {
    if (_pending.isEmpty || _socket == null || !_connected) return;
    final batch = List<Map<String, dynamic>>.from(_pending);
    _pending.clear();
    _socket!.emit('gps:flush', {'pings': batch});
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
    _pending.clear();
    _connected = false;
  }
}
