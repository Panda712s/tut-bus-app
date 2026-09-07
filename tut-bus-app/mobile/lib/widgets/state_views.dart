import 'package:flutter/material.dart';

import 'shimmer_box.dart';

// Soft accent tint used for the icon "chip" behind empty/error illustrations
// - the same low-alpha-over-current-background convention already used
// elsewhere in the app (see EmptyBusCard's icon chip), which reads correctly
// in both light and dark mode without needing separate theme branches.
const _accent = Color(0xFF0A5796);
const _accentChip = Color(0x140A5796); // ~8% accent, matches EmptyBusCard
const _accentChipSoft = Color(0x0A0A5796); // ~4% accent, for the outer ring
const _muted = Color(0xFF8A90A2);
const _danger = Color(0xFFDC2626);
const _dangerChip = Color(0x26F87171);
const _dangerChipSoft = Color(0x14F87171);

class LoadingView extends StatelessWidget {
  /// Plain centered spinner (unchanged default behaviour - existing call
  /// sites using `LoadingView(...)` keep working exactly as before).
  const LoadingView({super.key, this.message})
      : _skeleton = false,
        lineWidths = null;

  /// A skeleton/shimmer placeholder made of a few card-shaped shimmering
  /// rows, for screens that want a more premium loading state than a bare
  /// spinner. Purely additive - opt in per call site.
  ///
  /// [lineWidths] controls how many skeleton rows are shown and how wide
  /// each one is (as a fraction of the available width, 0-1). Defaults to
  /// three rows of decreasing width.
  const LoadingView.skeleton({super.key, this.lineWidths})
      : _skeleton = true,
        message = null;

  final String? message;
  final List<double>? lineWidths;
  final bool _skeleton;

  @override
  Widget build(BuildContext context) {
    if (_skeleton) {
      return _SkeletonList(widths: lineWidths ?? const [1.0, 1.0, 0.65]);
    }
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(strokeWidth: 2.5),
          ),
          if (message != null) ...[
            const SizedBox(height: 14),
            Text(message!, style: const TextStyle(color: _muted, fontSize: 13)),
          ],
        ],
      ),
    );
  }
}

class _SkeletonList extends StatelessWidget {
  const _SkeletonList({required this.widths});

  final List<double> widths;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          for (var i = 0; i < widths.length; i++) ...[
            if (i != 0) const SizedBox(height: 14),
            FractionallySizedBox(
              widthFactor: widths[i].clamp(0.3, 1.0),
              alignment: Alignment.centerLeft,
              child: const _SkeletonCard(),
            ),
          ],
        ],
      ),
    );
  }
}

/// A single card/list-row shaped skeleton placeholder: a small square
/// "avatar" shimmer next to two shimmering text-line placeholders,
/// suggesting the shape of the real content that's about to load in.
class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: const Row(
        children: [
          ShimmerBox(width: 44, height: 44, borderRadius: 14),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerBox(height: 14, borderRadius: 7),
                SizedBox(height: 10),
                ShimmerBox(width: 120, height: 11, borderRadius: 6),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const _IconBadge(
              icon: Icons.error_outline_rounded,
              iconColor: _danger,
              outer: _dangerChipSoft,
              inner: _dangerChip,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: _muted, height: 1.4),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Try again'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class EmptyView extends StatelessWidget {
  const EmptyView({super.key, required this.message, this.icon = Icons.inbox_outlined});

  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _IconBadge(icon: icon, iconColor: _accent, outer: _accentChipSoft, inner: _accentChip),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: _muted, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }
}

/// A soft two-tone circular badge used behind empty/error state icons: a
/// larger, very pale outer ring behind a smaller filled inner circle. Both
/// colours are low-alpha tints over whatever background they sit on, so
/// this reads correctly in both light and dark theme without any
/// brightness branching.
class _IconBadge extends StatelessWidget {
  const _IconBadge({required this.icon, required this.iconColor, required this.outer, required this.inner});
  // (const constructor above enables call sites with compile-time-constant
  // arguments, e.g. ErrorView's fixed danger palette, to be built as const.)

  final IconData icon;
  final Color iconColor;
  final Color outer;
  final Color inner;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 84,
      height: 84,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 84,
            height: 84,
            decoration: BoxDecoration(color: outer, shape: BoxShape.circle),
          ),
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(color: inner, shape: BoxShape.circle),
            child: Icon(icon, color: iconColor, size: 26),
          ),
        ],
      ),
    );
  }
}
