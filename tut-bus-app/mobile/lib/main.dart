import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'models/user_models.dart';
import 'state/auth_state.dart';
import 'screens/shared/splash_screen.dart';
import 'screens/auth/role_select_screen.dart';
import 'screens/student/student_shell.dart';
import 'screens/driver/driver_shell.dart';

void main() {
  runApp(const TutBusApp());
}

class TutBusApp extends StatelessWidget {
  const TutBusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthState(),
      child: MaterialApp(
        title: 'TUT Bus App',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorSchemeSeed: const Color(0xFF1E63E0),
          scaffoldBackgroundColor: const Color(0xFFF8FAFC),
          appBarTheme: const AppBarTheme(
            backgroundColor: Colors.white,
            foregroundColor: Colors.black87,
            elevation: 0,
            centerTitle: false,
          ),
        ),
        home: const RootRouter(),
      ),
    );
  }
}

/// Decides which flow to show: splash while auth state restores, the
/// role-select/login flow when signed out, or the student/driver shell
/// once signed in (based on the role embedded in the stored JWT).
class RootRouter extends StatelessWidget {
  const RootRouter({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();

    switch (auth.status) {
      case AuthStatus.unknown:
        return const SplashScreen();
      case AuthStatus.signedOut:
        return const RoleSelectScreen();
      case AuthStatus.signedIn:
        if (auth.user?.role == AppRole.driver) {
          return const DriverShell();
        }
        return const StudentShell();
    }
  }
}
