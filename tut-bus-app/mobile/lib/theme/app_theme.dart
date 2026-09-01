import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';

/// Brand accent (shared by both themes) plus semantic status colours.
class AppColors {
  AppColors._();

  static const accent = Color(0xFF0A5796); // official TUT blue
  static const accentStrong = Color(0xFF073E68);
  static const accentSoft = Color(0x240A5796); // ~14% TUT blue
  static const gold = Color(0xFFFAB416); // TUT gold, secondary accent

  // Dark surfaces (kept as named constants for the few screens that still
  // reference them directly).
  static const canvas = Color(0xFF090A0F);
  static const surface = Color(0xFF131620);
  static const surfaceRaised = Color(0xFF1A1E2B);
  static const surfaceInset = Color(0xFF0E1018);
  static const line = Color(0xFF262B3A);
  static const ink = Color(0xFFE8EAF0);
  static const inkMuted = Color(0xFFA2A9BC);
  static const inkDim = Color(0xFF6C7385);

  static const ok = Color(0xFF34D399);
  static const warn = Color(0xFFFBBF24);
  static const danger = Color(0xFFF87171);
}

class _Palette {
  const _Palette({
    required this.canvas,
    required this.surface,
    required this.surfaceRaised,
    required this.surfaceInset,
    required this.line,
    required this.ink,
    required this.inkMuted,
    required this.inkDim,
  });

  final Color canvas, surface, surfaceRaised, surfaceInset, line, ink, inkMuted, inkDim;

  static const dark = _Palette(
    canvas: Color(0xFF090A0F),
    surface: Color(0xFF131620),
    surfaceRaised: Color(0xFF1A1E2B),
    surfaceInset: Color(0xFF0E1018),
    line: Color(0xFF262B3A),
    ink: Color(0xFFE8EAF0),
    inkMuted: Color(0xFFA2A9BC),
    inkDim: Color(0xFF6C7385),
  );

  static const light = _Palette(
    canvas: Color(0xFFF6F7FB),
    surface: Color(0xFFFFFFFF),
    surfaceRaised: Color(0xFFFFFFFF),
    surfaceInset: Color(0xFFF1F3F9),
    line: Color(0xFFE3E6EF),
    ink: Color(0xFF161923),
    inkMuted: Color(0xFF5B6172),
    inkDim: Color(0xFF8A90A2),
  );
}

ThemeData buildAppTheme(Brightness brightness) {
  final dark = brightness == Brightness.dark;
  final p = dark ? _Palette.dark : _Palette.light;

  final colorScheme = ColorScheme.fromSeed(
    seedColor: AppColors.accent,
    brightness: brightness,
    surface: p.surface,
  ).copyWith(
    primary: AppColors.accent,
    onPrimary: Colors.white,
    surfaceContainerHighest: p.surfaceRaised,
    onSurfaceVariant: p.inkMuted,
    outline: p.line,
    error: AppColors.danger,
  );

  final baseText = (dark ? Typography.whiteMountainView : Typography.blackMountainView)
      .apply(bodyColor: p.ink, displayColor: p.ink);

  OutlineInputBorder border(Color c, [double w = 1]) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: c, width: w),
      );

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: p.canvas,
    canvasColor: p.canvas,
    cardColor: p.surface,
    dividerColor: p.line,
    hintColor: p.inkDim,
    splashFactory: InkSparkle.splashFactory,
    visualDensity: VisualDensity.adaptivePlatformDensity,
    textTheme: baseText,

    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: CupertinoPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      },
    ),

    appBarTheme: AppBarTheme(
      backgroundColor: p.canvas,
      foregroundColor: p.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: p.ink,
        fontSize: 18,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.2,
      ),
    ),

    dividerTheme: DividerThemeData(color: p.line, thickness: 1, space: 1),

    listTileTheme: ListTileThemeData(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      iconColor: p.inkMuted,
      textColor: p.ink,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
    ),

    cardTheme: CardThemeData(
      color: p.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(14)),
        side: BorderSide(color: p.line),
      ),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: p.surfaceInset,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      hintStyle: TextStyle(color: p.inkDim),
      labelStyle: TextStyle(color: p.inkMuted),
      enabledBorder: border(p.line),
      focusedBorder: border(AppColors.accent, 2),
      errorBorder: border(AppColors.danger),
      focusedErrorBorder: border(AppColors.danger, 2),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.accent,
        foregroundColor: Colors.white,
        elevation: 0,
        minimumSize: const Size(0, 50),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),

    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.accent,
        foregroundColor: Colors.white,
        minimumSize: const Size(0, 50),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: p.ink,
        minimumSize: const Size(0, 50),
        side: BorderSide(color: p.line),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),

    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.accent,
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    ),

    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(foregroundColor: p.inkMuted),
    ),

    chipTheme: ChipThemeData(
      backgroundColor: p.surfaceRaised,
      selectedColor: AppColors.accentSoft,
      side: BorderSide(color: p.line),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      labelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: p.ink),
    ),

    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: p.surface,
      indicatorColor: AppColors.accentSoft,
      elevation: 0,
      labelTextStyle: WidgetStateProperty.all(
        TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: p.inkMuted),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(
          color: states.contains(WidgetState.selected) ? AppColors.accent : p.inkDim,
        ),
      ),
    ),

    radioTheme: RadioThemeData(
      fillColor: WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.selected) ? AppColors.accent : p.inkDim,
      ),
    ),

    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: p.surfaceRaised,
      contentTextStyle: TextStyle(color: p.ink),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),

    dialogTheme: DialogThemeData(
      backgroundColor: p.surface,
      surfaceTintColor: Colors.transparent,
    ),

    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: p.surface,
      surfaceTintColor: Colors.transparent,
      dragHandleColor: p.line,
    ),

    progressIndicatorTheme: const ProgressIndicatorThemeData(color: AppColors.accent),
  );
}
