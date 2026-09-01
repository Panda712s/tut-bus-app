// Smoke test: the app boots without crashing.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tut_bus_app/main.dart';
import 'package:tut_bus_app/state/settings_controller.dart';

void main() {
  testWidgets('App boots without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(TutBusApp(settings: SettingsController()));
    await tester.pump();
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
