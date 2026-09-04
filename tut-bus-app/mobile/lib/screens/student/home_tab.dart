import 'package:flutter/material.dart';
import '../../models/transport_models.dart';
import '../../models/user_models.dart';
import '../../services/student_repository.dart';
import '../../services/transport_repository.dart';
import '../../widgets/capacity_badge.dart';
import '../../widgets/state_views.dart';
import '../../widgets/tut_background.dart';
import 'route_detail_screen.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  final _studentRepo = StudentRepository();
  final _transportRepo = TransportRepository();

  StudentProfile? _profile;
  List<BusRoute> _favourites = [];
  List<LiveBus> _nearbyBuses = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    // The profile is the only essential call - if it fails, show the error
    // screen. The favourites/live-buses sections degrade gracefully on their own.
    try {
      final profile = await _studentRepo.fetchMyProfile();
      if (!mounted) return;
      setState(() => _profile = profile);
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Could not load your profile.\n$e';
          _loading = false;
        });
      }
      return;
    }

    final favs = await _transportRepo.fetchFavouriteRoutes().catchError((_) => <BusRoute>[]);
    final buses = await _transportRepo.fetchLiveBuses().catchError((_) => <LiveBus>[]);
    if (!mounted) return;
    setState(() {
      _favourites = favs;
      _nearbyBuses = buses.take(5).toList();
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('TUT Bus App'),
        actions: [
          IconButton(
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: TutBackground(
        child: _loading
            ? const LoadingView()
            : _error != null
                ? ErrorView(message: _error!, onRetry: _load)
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                      children: [
                        Text(
                          'Hi, ${_profile?.fullName.split(' ').first ?? 'there'} 👋',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.4),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          "Here's what's happening on campus transport today.",
                          style: TextStyle(color: Color(0xFF8A90A2), fontSize: 13.5),
                        ),
                        const SizedBox(height: 20),
                        const _AnnouncementCard(),
                        const SizedBox(height: 26),
                        _SectionHeader(
                          title: 'Active buses nearby',
                          trailing: _nearbyBuses.isEmpty ? null : '${_nearbyBuses.length}',
                        ),
                        const SizedBox(height: 10),
                        if (_nearbyBuses.isEmpty)
                          const _EmptyHint(
                            icon: Icons.directions_bus_outlined,
                            text: 'No buses are on the road right now.',
                          )
                        else
                          ..._nearbyBuses.map(
                            (bus) => _TileCard(
                              leadingIcon: Icons.directions_bus_filled_rounded,
                              leadingColor: const Color(0xFF0A5796),
                              title: bus.busNumber,
                              subtitle: '${bus.passengerCount}/${bus.capacity} passengers',
                              trailing: CapacityBadge(state: bus.capacityState),
                            ),
                          ),
                        const SizedBox(height: 22),
                        const _SectionHeader(title: 'Your favourite routes'),
                        const SizedBox(height: 10),
                        if (_favourites.isEmpty)
                          const _EmptyHint(
                            icon: Icons.star_border_rounded,
                            text: 'Star a route from the Routes tab to pin it here.',
                          )
                        else
                          ..._favourites.map(
                            (route) => _TileCard(
                              leadingIcon: Icons.star_rounded,
                              leadingColor: const Color(0xFFFAB416),
                              title: route.name,
                              subtitle: '${route.origin} → ${route.destination}',
                              trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF8A90A2)),
                              onTap: () => Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => RouteDetailScreen(routeId: route.id)),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.trailing});

  final String title;
  final String? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5)),
        if (trailing != null) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
            decoration: BoxDecoration(
              color: const Color(0x1F0A5796),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              trailing!,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF0A5796)),
            ),
          ),
        ],
      ],
    );
  }
}

class _TileCard extends StatelessWidget {
  const _TileCard({
    required this.leadingIcon,
    required this.leadingColor,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.onTap,
  });

  final IconData leadingIcon;
  final Color leadingColor;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(14),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: theme.dividerColor),
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Container(
                    height: 40,
                    width: 40,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: leadingColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: Icon(leadingIcon, color: leadingColor, size: 21),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5)),
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: const TextStyle(color: Color(0xFF8A90A2), fontSize: 12.5),
                        ),
                      ],
                    ),
                  ),
                  if (trailing != null) ...[const SizedBox(width: 10), trailing!],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyHint extends StatelessWidget {
  const _EmptyHint({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: const Color(0xFF8A90A2)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(text, style: const TextStyle(color: Color(0xFF8A90A2), fontSize: 13)),
          ),
        ],
      ),
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  const _AnnouncementCard();

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
                          'No campus announcements right now.',
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
