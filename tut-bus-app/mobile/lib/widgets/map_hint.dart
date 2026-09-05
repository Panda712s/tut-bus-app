import 'package:flutter/material.dart';

/// Small pill-shaped hint overlaid on a live map (e.g. "No buses are on the
/// road right now.").
class MapHint extends StatelessWidget {
  const MapHint({super.key, required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Theme.of(context).dividerColor),
        boxShadow: const [BoxShadow(color: Color(0x22000000), blurRadius: 12, offset: Offset(0, 4))],
      ),
      child: Text(text, style: const TextStyle(fontSize: 13, color: Color(0xFF8A90A2))),
    );
  }
}
