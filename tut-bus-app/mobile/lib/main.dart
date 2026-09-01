import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'l10n/app_l10n.dart';
import 'models/user_models.dart';
import 'state/auth_state.dart';
import 'state/settings_controller.dart';
import 'theme/app_theme.dart';
import 'screens/shared/splash_screen.dart';
import 'screens/auth/role_select_screen.dart';
import 'screens/student/student_shell.dart';
import 'screens/driver/driver_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final settings = SettingsController()..load();
  runApp(TutBusApp(settings: settings));
}

class TutBusApp extends StatelessWidget {
  const TutBusApp({super.key, required this.settings});

  final SettingsController settings;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthState()),
        ChangeNotifierProvider.value(value: settings),
      ],
      child: Consumer<SettingsController>(
        builder: (context, s, _) {
          final dark = s.themeMode == ThemeMode.dark ||
              (s.themeMode == ThemeMode.system &&
                  WidgetsBinding.instance.platformDispatcher.platformBrightness == Brightness.dark);
          SystemChrome.setSystemUIOverlayStyle(
            SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness: dark ? Brightness.light : Brightness.dark,
              systemNavigationBarColor: dark ? AppColors.canvas : const Color(0xFFF6F7FB),
              systemNavigationBarIconBrightness: dark ? Brightness.light : Brightness.dark,
            ),
          );
          return MaterialApp(
            title: 'TUT Bus App',
            debugShowCheckedModeBanner: false,
            theme: buildAppTheme(Brightness.light),
            darkTheme: buildAppTheme(Brightness.dark),
            themeMode: s.themeMode,
            locale: s.locale,
            supportedLocales: AppL10n.supportedLocales,
            localizationsDelegates: const [
              AppL10n.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: const RootRouter(),
          );
        },
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
