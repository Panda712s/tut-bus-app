/// TUT issues students addresses on the `tut4life.ac.za` domain
/// (staff and administrators use `tut.ac.za`). The student app only
/// accepts student addresses for sign-in and registration.
final RegExp kTutStudentEmail = RegExp(
  r'^[^@\s]+@tut4life\.ac\.za$',
  caseSensitive: false,
);

/// Form-field validator: returns an error string for anything that is not a
/// well-formed TUT student email, or null when it is valid.
String? validateTutStudentEmail(String? value) {
  final email = value?.trim() ?? '';
  if (email.isEmpty) return 'Enter your TUT student email';
  if (!kTutStudentEmail.hasMatch(email)) {
    return 'Use your TUT student email (yourname@tut4life.ac.za)';
  }
  return null;
}
