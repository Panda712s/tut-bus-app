import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// App-wide user preferences: theme (night mode) and language.
/// Persisted with shared_preferences and restored on launch.
class SettingsController extends ChangeNotifier {
  static const _kThemeMode = 'settings.themeMode';
  static const _kLocale = 'settings.locale';

  ThemeMode _themeMode = ThemeMode.system;
  Locale? _locale; // null = follow the device language

  ThemeMode get themeMode => _themeMode;
  Locale? get locale => _locale;

  /// Language code actually in effect (device language when [_locale] is null).
  String effectiveLanguageCode(BuildContext context) =>
      _locale?.languageCode ?? Localizations.localeOf(context).languageCode;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();

    switch (prefs.getString(_kThemeMode)) {
      case 'light':
        _themeMode = ThemeMode.light;
        break;
      case 'dark':
        _themeMode = ThemeMode.dark;
        break;
      default:
        _themeMode = ThemeMode.system;
    }

    final code = prefs.getString(_kLocale);
    _locale = (code == null || code.isEmpty) ? null : Locale(code);

    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (mode == _themeMode) return;
    _themeMode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kThemeMode, mode.name);
  }

  /// Pass null to follow the device language.
  Future<void> setLocale(Locale? locale) async {
    if (locale?.languageCode == _locale?.languageCode) return;
    _locale = locale;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    if (locale == null) {
      await prefs.remove(_kLocale);
    } else {
      await prefs.setString(_kLocale, locale.languageCode);
    }
  }
}
