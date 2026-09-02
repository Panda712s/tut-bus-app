import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Wraps a screen body with a very faint Tshwane University of Technology
/// logo watermark anchored bottom-centre, so the student screens carry the
/// institutional branding without getting in the way of content.
class TutBackground extends StatelessWidget {
  const TutBackground({super.key, required this.child, this.alignment = const Alignment(0, 0.92)});

  final Widget child;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Stack(
      children: [
        Positioned.fill(
          child: IgnorePointer(
            child: Align(
              alignment: alignment,
              child: FractionallySizedBox(
                widthFactor: 0.78,
                child: Opacity(
                  opacity: dark ? 0.05 : 0.045,
                  child: SvgPicture.asset(
                    'assets/brand/tut-logo.svg',
                    fit: BoxFit.contain,
                    colorFilter:
                        dark ? const ColorFilter.mode(Colors.white, BlendMode.srcIn) : null,
                  ),
                ),
              ),
            ),
          ),
        ),
        child,
      ],
    );
  }
}
