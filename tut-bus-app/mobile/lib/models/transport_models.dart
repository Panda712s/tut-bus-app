class BusStop {
  final String id;
  final String name;
  final double lat;
  final double lng;
  final int order;

  BusStop({required this.id, required this.name, required this.lat, required this.lng, required this.order});

  factory BusStop.fromJson(Map<String, dynamic> json) => BusStop(
        id: json['id'] as String,
        name: json['name'] as String,
        lat: (json['lat'] as num).toDouble(),
        lng: (json['lng'] as num).toDouble(),
        order: json['order'] as int? ?? 0,
      );
}

class BusRoute {
  final String id;
  final String name;
  final String origin;
  final String destination;
  final double? distanceKm;
  final int? estimatedDurationMin;
  final List<BusStop> stops;

  BusRoute({
    required this.id,
    required this.name,
    required this.origin,
    required this.destination,
    this.distanceKm,
    this.estimatedDurationMin,
    this.stops = const [],
  });

  factory BusRoute.fromJson(Map<String, dynamic> json) => BusRoute(
        id: json['id'] as String,
        name: json['name'] as String,
        origin: json['origin'] as String,
        destination: json['destination'] as String,
        distanceKm: (json['distanceKm'] as num?)?.toDouble(),
        estimatedDurationMin: json['estimatedDurationMin'] as int?,
        stops: (json['stops'] as List<dynamic>? ?? [])
            .map((s) => BusStop.fromJson(s as Map<String, dynamic>))
            .toList(),
      );
}

enum CapacityState { empty, moderate, full }

CapacityState capacityFromString(String? value) {
  switch (value) {
    case 'MODERATE':
      return CapacityState.moderate;
    case 'FULL':
      return CapacityState.full;
    default:
      return CapacityState.empty;
  }
}

class LiveBus {
  final String id;
  final String busNumber;
  final double? lat;
  final double? lng;
  final double? heading;
  final double? speedKmh;
  final CapacityState capacityState;
  final int passengerCount;
  final int capacity;
  final String? routeId;

  LiveBus({
    required this.id,
    required this.busNumber,
    this.lat,
    this.lng,
    this.heading,
    this.speedKmh,
    required this.capacityState,
    required this.passengerCount,
    required this.capacity,
    this.routeId,
  });

  factory LiveBus.fromJson(Map<String, dynamic> json) => LiveBus(
        id: json['id'] as String? ?? json['busId'] as String,
        busNumber: json['busNumber'] as String? ?? '',
        lat: (json['currentLat'] ?? json['lat'] as num?)?.toDouble(),
        lng: (json['currentLng'] ?? json['lng'] as num?)?.toDouble(),
        heading: (json['heading'] as num?)?.toDouble(),
        speedKmh: (json['speedKmh'] as num?)?.toDouble(),
        capacityState: capacityFromString(json['capacityState'] as String?),
        passengerCount: json['passengerCount'] as int? ?? 0,
        capacity: json['capacity'] as int? ?? 60,
        routeId: json['currentRouteId'] as String? ?? json['routeId'] as String?,
      );

  /// Merges a freshly-decoded live-location update with the previously known
  /// state for the same bus, keeping the previous seating capacity since the
  /// GPS socket payload doesn't carry it.
  static LiveBus mergeLocationUpdate(LiveBus incoming, LiveBus? previous) {
    final previousCapacity = previous?.capacity;
    return previousCapacity != null
        ? LiveBus(
            id: incoming.id,
            busNumber: incoming.busNumber,
            lat: incoming.lat,
            lng: incoming.lng,
            heading: incoming.heading,
            speedKmh: incoming.speedKmh,
            capacityState: incoming.capacityState,
            passengerCount: incoming.passengerCount,
            capacity: previousCapacity,
            routeId: incoming.routeId,
          )
        : incoming;
  }
}

class Schedule {
  final String id;
  final String dayType;
  final String period;
  final String departureTime;

  Schedule({required this.id, required this.dayType, required this.period, required this.departureTime});

  factory Schedule.fromJson(Map<String, dynamic> json) => Schedule(
        id: json['id'] as String,
        dayType: json['dayType'] as String,
        period: json['period'] as String,
        departureTime: json['departureTime'] as String,
      );
}

class AppNotification {
  final String recipientId;
  final String id;
  final String title;
  final String body;
  final String type;
  final DateTime createdAt;
  final bool read;

  AppNotification({
    required this.recipientId,
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.createdAt,
    required this.read,
  });

  factory AppNotification.fromRecipientJson(Map<String, dynamic> json) {
    final notification = json['notification'] as Map<String, dynamic>;
    return AppNotification(
      recipientId: json['id'] as String,
      id: notification['id'] as String,
      title: notification['title'] as String,
      body: notification['body'] as String,
      type: notification['type'] as String,
      createdAt: DateTime.parse(notification['createdAt'] as String),
      read: json['read'] as bool? ?? false,
    );
  }
}

class TripHistoryEntry {
  final String id;
  final DateTime boardedAt;
  final DateTime? alightedAt;
  final String? routeName;
  final String? busNumber;

  TripHistoryEntry({required this.id, required this.boardedAt, this.alightedAt, this.routeName, this.busNumber});

  factory TripHistoryEntry.fromJson(Map<String, dynamic> json) {
    final trip = json['trip'] as Map<String, dynamic>?;
    return TripHistoryEntry(
      id: json['id'] as String,
      boardedAt: DateTime.parse(json['boardedAt'] as String),
      alightedAt: json['alightedAt'] != null ? DateTime.parse(json['alightedAt'] as String) : null,
      routeName: trip != null ? (trip['route']?['name'] as String?) : null,
      busNumber: trip != null ? (trip['bus']?['busNumber'] as String?) : null,
    );
  }
}
