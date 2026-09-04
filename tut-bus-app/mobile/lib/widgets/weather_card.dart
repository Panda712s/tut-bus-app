import 'package:flutter/material.dart';

/// Shared "today's conditions" card shown on both the student and driver
/// home dashboards. There's no live weather feed wired up yet, so this
/// renders a fixed, sensible placeholder rather than fabricate live-looking
/// numbers - the layout is what matters and drops in real data later.
class WeatherCard extends StatelessWidget {
  const WeatherCard({super.key, this.footer = 'No campus announcements right now.'});

  /// The line shown under the divider - defaults to the student "campus
  /// announcements" copy; the driver screen passes road-safety copy instead.
  final String footer;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0A5796), Color(0xFF073E68)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(color: Color(0x330A5796), blurRadius: 24, offset: Offset(0, 10)),
          ],
        ),
        child: Stack(
          children: [
            // Decorative oversized watermark icon for depth.
            Positioned(
              right: -18,
              top: -22,
              child: Icon(Icons.wb_sunny_rounded, size: 130, color: Colors.white.withValues(alpha: 0.07)),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 50,
                        width: 50,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.16),
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: const Icon(Icons.wb_sunny_rounded, color: Color(0xFFFAB416), size: 27),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              crossAxisAlignment: CrossAxisAlignment.baseline,
                              textBaseline: TextBaseline.alphabetic,
                              children: [
                                Text(
                                  '22°',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 30,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'Clear skies',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14.5),
                                ),
                              ],
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'Pretoria • Good conditions for travel',
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.72), fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Divider(height: 1, color: Colors.white.withValues(alpha: 0.14)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(Icons.campaign_outlined, size: 16, color: Colors.white.withValues(alpha: 0.7)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          footer,
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 12.5),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
