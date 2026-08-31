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
