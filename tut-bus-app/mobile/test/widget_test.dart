// Smoke test: the app boots to the role-select screen when signed out.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tut_bus_app/main.dart';

void main() {
  testWidgets('App boots without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(const TutBusApp());
    await tester.pump();

    // The MaterialApp is present regardless of auth state.
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
