import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Faint Tshwane University of Technology logo, used as a login-screen
/// background watermark. Wrap the screen body in a [Stack] with this behind it.
class TutWatermark extends StatelessWidget {
  const TutWatermark({super.key});

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return IgnorePointer(
      child: Center(
        child: FractionallySizedBox(
          widthFactor: 0.86,
          child: Opacity(
            opacity: dark ? 0.06 : 0.05,
            child: SvgPicture.asset(
              'assets/brand/tut-logo.svg',
              fit: BoxFit.contain,
              colorFilter: dark
                  ? const ColorFilter.mode(Colors.white, BlendMode.srcIn)
                  : null,
            ),
          ),
        ),
      ),
    );
  }
}
