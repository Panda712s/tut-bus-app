import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'tut_watermark.dart';

/// Shared canvas for the auth screens (role select + logins + register):
/// a soft accent glow at the top and the faint TUT watermark behind the
/// caller's [child].
class AuthBackdrop extends StatelessWidget {
  const AuthBackdrop({super.key, required this.child, this.showWatermark = true});

  final Widget child;
  final bool showWatermark;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const Positioned(
          top: -160,
          left: -40,
          right: -40,
          height: 380,
          child: IgnorePointer(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.topCenter,
                  radius: 0.9,
                  colors: [Color(0x3D0A5796), Color(0x00000000)],
                ),
              ),
            ),
          ),
        ),
        if (showWatermark) const Positioned.fill(child: TutWatermark()),
        SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: child,
            ),
          ),
        ),
      ],
    );
  }
}

/// The TUT logo above an app-name heading and an optional subtitle,
/// centred. Used at the top of every auth screen.
class AuthHeader extends StatelessWidget {
  const AuthHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.logoHeight = 60,
  });

  final String title;
  final String? subtitle;
  final double logoHeight;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SvgPicture.asset('assets/brand/tut-logo.svg', height: logoHeight),
        const SizedBox(height: 22),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.3),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF8A90A2), fontSize: 13.5, height: 1.35),
          ),
        ],
      ],
    );
  }
}
