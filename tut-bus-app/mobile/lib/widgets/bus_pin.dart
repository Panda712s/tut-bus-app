import 'package:flutter/material.dart';

/// Circular bus marker for the live map, highlighted with a gold ring when
/// it represents the signed-in driver's own bus.
class BusPin extends StatelessWidget {
  const BusPin({super.key, required this.label, required this.colour, this.isMine = false, required this.onTap});

  final String label;
  final Color colour;
  final bool isMine;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: colour,
          shape: BoxShape.circle,
          border: Border.all(color: isMine ? const Color(0xFFFAB416) : Colors.white, width: isMine ? 3.5 : 2.5),
          boxShadow: [
            BoxShadow(color: const Color(0x55000000), blurRadius: isMine ? 10 : 6, offset: const Offset(0, 2)),
          ],
        ),
        child: Icon(Icons.directions_bus_filled_rounded, color: Colors.white, size: isMine ? 26 : 20),
      ),
    );
  }
}
