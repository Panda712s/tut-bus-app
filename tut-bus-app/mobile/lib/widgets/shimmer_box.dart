import 'package:flutter/material.dart';

/// A reusable shimmering placeholder block used to build skeleton loading
/// states (see `LoadingView.skeleton` in `state_views.dart`).
///
/// Renders a rounded rectangle in a soft base tone with an animated
/// highlight band sweeping across it - the standard "shimmer" loading
/// effect - implemented from scratch with an [AnimationController] driving
/// a [LinearGradient] through a [GradientTransform], so no extra package
/// is needed. Colours are derived from [Theme.of(context)]'s brightness so
/// the effect reads correctly in both light and dark mode.
class ShimmerBox extends StatefulWidget {
  const ShimmerBox({super.key, this.width, this.height = 14, this.borderRadius = 8});

  /// Fixed width, or `null` to fill the available width (typical for a
  /// text-line placeholder inside a bounded parent).
  final double? width;
  final double height;
  final double borderRadius;

  @override
  State<ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<ShimmerBox> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1300),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final base = dark ? const Color(0xFF1E2230) : const Color(0xFFE7EAF2);
    final sheen = dark ? const Color(0xFF343B54) : Colors.white;

    return ClipRRect(
      borderRadius: BorderRadius.circular(widget.borderRadius),
      child: SizedBox(
        width: widget.width ?? double.infinity,
        height: widget.height,
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return ShaderMask(
              blendMode: BlendMode.srcATop,
              shaderCallback: (bounds) => LinearGradient(
                colors: [base, sheen, base],
                stops: const [0.35, 0.5, 0.65],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                transform: _SlidingGradientTransform(slidePercent: _controller.value),
              ).createShader(bounds),
              child: child,
            );
          },
          child: Container(color: base),
        ),
      ),
    );
  }
}

/// Translates a [LinearGradient] horizontally by a multiple of the shaded
/// bounds' width, used to sweep the highlight band across a [ShimmerBox]
/// as [slidePercent] animates from 0 to 1 on a repeating loop.
class _SlidingGradientTransform extends GradientTransform {
  const _SlidingGradientTransform({required this.slidePercent});

  final double slidePercent;

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    // Sweeps the gradient band from just off the left edge to just off the
    // right edge as slidePercent loops from 0 to 1.
    return Matrix4.translationValues(bounds.width * (slidePercent * 3 - 1.5), 0, 0);
  }
}
