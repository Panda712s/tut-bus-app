enum AppRole { student, driver, admin }

AppRole roleFromString(String value) {
  switch (value) {
    case 'DRIVER':
      return AppRole.driver;
    case 'ADMIN':
      return AppRole.admin;
    default:
      return AppRole.student;
  }
}

class AuthUser {
  final String id;
  final String email;
  final AppRole role;

  AuthUser({required this.id, required this.email, required this.role});

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'] as String,
        email: json['email'] as String,
        role: roleFromString(json['role'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'role': role == AppRole.driver
            ? 'DRIVER'
            : role == AppRole.admin
                ? 'ADMIN'
                : 'STUDENT',
      };
}

class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final AuthUser user;

  AuthResponse({required this.accessToken, required this.refreshToken, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String,
        user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
      );
}

class StudentProfile {
  final String id;
  final String studentNumber;
  final String fullName;
  final String email;
  final String? phone;
  final String? profileImageUrl;
  final bool emailVerified;

  StudentProfile({
    required this.id,
    required this.studentNumber,
    required this.fullName,
    required this.email,
    this.phone,
    this.profileImageUrl,
    required this.emailVerified,
  });

  factory StudentProfile.fromJson(Map<String, dynamic> json) => StudentProfile(
        id: json['id'] as String,
        studentNumber: json['studentNumber'] as String,
        fullName: json['fullName'] as String,
        email: json['email'] as String,
        phone: json['phone'] as String?,
        profileImageUrl: json['profileImageUrl'] as String?,
        emailVerified: json['emailVerified'] as bool? ?? false,
      );
}

class DriverProfile {
  final String id;
  final String employeeNumber;
  final String fullName;
  final String email;
  final String status;
  final String? assignedBusId;
  final String? profileImageUrl;

  DriverProfile({
    required this.id,
    required this.employeeNumber,
    required this.fullName,
    required this.email,
    required this.status,
    this.assignedBusId,
    this.profileImageUrl,
  });

  factory DriverProfile.fromJson(Map<String, dynamic> json) => DriverProfile(
        id: json['id'] as String,
        employeeNumber: json['employeeNumber'] as String,
        fullName: json['fullName'] as String,
        email: json['email'] as String,
        status: json['status'] as String? ?? 'ACTIVE',
        assignedBusId: json['assignedBusId'] as String?,
        profileImageUrl: json['profileImageUrl'] as String?,
      );
}
