export type Role = 'STUDENT' | 'DRIVER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Student {
  id: string;
  studentNumber: string;
  fullName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface Driver {
  id: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone?: string | null;
  licenseNumber: string;
  profileImageUrl?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_TRIP' | 'SUSPENDED';
  isActive: boolean;
  assignedBusId?: string | null;
  createdAt: string;
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm?: number | null;
  estimatedDurationMin?: number | null;
  isActive: boolean;
  stops?: BusStop[];
  _count?: { buses: number };
}

export interface BusStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
  routeId: string;
}

export interface Bus {
  id: string;
  busNumber: string;
  plateNumber: string;
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  capacityState: 'EMPTY' | 'MODERATE' | 'FULL';
  passengerCount: number;
  currentLat?: number | null;
  currentLng?: number | null;
  heading?: number | null;
  speedKmh?: number | null;
  lastLocationAt?: string | null;
  currentRouteId?: string | null;
  currentRoute?: Route | null;
  currentDriver?: { id: string; fullName: string }[];
}

export interface LiveBus {
  id: string;
  busNumber: string;
  currentLat: number | null;
  currentLng: number | null;
  heading: number | null;
  speedKmh: number | null;
  lastLocationAt: string | null;
  capacityState: 'EMPTY' | 'MODERATE' | 'FULL';
  passengerCount: number;
  capacity: number;
  currentRouteId?: string | null;
}

export interface Schedule {
  id: string;
  routeId: string;
  dayType: 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';
  period: 'MORNING' | 'AFTERNOON' | 'EVENING';
  departureTime: string;
  isActive: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  audience: string;
  createdAt: string;
}

export interface FeedbackItem {
  id: string;
  category: 'DRIVER_RATING' | 'ISSUE_REPORT' | 'SUGGESTION';
  rating?: number | null;
  comment?: string | null;
  createdAt: string;
  student?: { id: string; fullName: string; studentNumber: string };
}

export interface AnalyticsOverview {
  studentCount: number;
  driverCount: number;
  busCount: number;
  activeTripCount: number;
  routeCount: number;
  feedbackCount: number;
  averageDriverRating: number | null;
}

// ----- Operations: live fleet wall -----

export interface FleetEntry {
  tripId: string;
  tripStatus: 'IN_PROGRESS' | 'PAUSED';
  startedAt: string | null;
  bus: {
    id: string;
    busNumber: string;
    plateNumber: string;
    lat: number | null;
    lng: number | null;
    speedKmh: number | null;
    heading: number | null;
    capacity: number;
    passengerCount: number;
    capacityState: 'EMPTY' | 'MODERATE' | 'FULL';
  };
  route: { id: string; name: string };
  driver: { id: string; fullName: string; phone?: string | null };
  fixAgeSeconds: number | null;
  gpsStale: boolean;
  offRoute: { alertId: string; distanceMeters: number; since: string } | null;
}

export interface FleetSnapshot {
  generatedAt: string;
  activeTripCount: number;
  openDeviationCount: number;
  activeSosCount: number;
  gpsStaleCount: number;
  buses: FleetEntry[];
}

export interface DeviationAlert {
  id: string;
  status: 'OPEN' | 'CLEARED';
  lat: number;
  lng: number;
  distanceMeters: number;
  createdAt: string;
  clearedAt: string | null;
  tripId: string;
  busId: string;
  bus: { busNumber: string };
  trip: { id: string; driver: { fullName: string }; route: { name: string } };
}

// ----- Safety: SOS alerts -----

export interface SosAlert {
  id: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  lat: number | null;
  lng: number | null;
  note: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  raisedBy: { kind: 'STUDENT' | 'DRIVER' | 'UNKNOWN'; name: string | null; ref: string | null; phone: string | null };
  trip: { id: string; status: string; busNumber: string | null; routeName: string | null } | null;
}

// ----- Ratings -----

export interface TripRatingItem {
  id: string;
  direction: 'STUDENT_TO_DRIVER' | 'DRIVER_TO_TRIP';
  score: number;
  tags: string[];
  comment: string | null;
  createdAt: string;
  student?: { fullName: string; studentNumber: string } | null;
  driver?: { fullName: string } | null;
  trip?: { id: string; route: { name: string } } | null;
}

// ----- ETA -----

export interface RouteEtaBus {
  busId: string;
  busNumber: string;
  routeId: string;
  lat: number;
  lng: number;
  speedKmh: number | null;
  capacityState: 'EMPTY' | 'MODERATE' | 'FULL';
  passengerCount: number;
  fixAgeSeconds: number;
  stops: { stopId: string; stopName: string; order: number; distanceMeters: number; etaSeconds: number; etaAt: string }[];
}
