import 'package:flutter/material.dart';

/// Bold section heading used to separate blocks of content on a screen.
class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(text, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5));
  }
}
