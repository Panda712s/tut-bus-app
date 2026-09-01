import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/transport_models.dart';
import '../../services/transport_repository.dart';
import '../../widgets/state_views.dart';
import 'route_detail_screen.dart';

class RoutesTab extends StatefulWidget {
  const RoutesTab({super.key});

  @override
  State<RoutesTab> createState() => _RoutesTabState();
}

class _RoutesTabState extends State<RoutesTab> {
  final _repo = TransportRepository();
  final _searchController = TextEditingController();
  List<BusRoute> _routes = [];
  bool _loading = true;
  String? _error;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load([String? search]) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final routes = await _repo.fetchRoutes(search: search);
      setState(() => _routes = routes);
    } catch (_) {
      setState(() => _error = 'Could not load routes.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () => _load(value));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bus Routes')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              decoration: InputDecoration(
                hintText: 'Search by campus, route or destination',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: const Color(0xFF0E1018),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingView()
                : _error != null
                    ? ErrorView(message: _error!, onRetry: () => _load(_searchController.text))
                    : _routes.isEmpty
                        ? const EmptyView(message: 'No routes match your search.', icon: Icons.alt_route_outlined)
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _routes.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final route = _routes[index];
                              return Card(
                                child: ListTile(
                                  title: Text(route.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                  subtitle: Text('${route.origin} → ${route.destination}'),
                                  trailing: route.estimatedDurationMin != null
                                      ? Text('${route.estimatedDurationMin} min', style: const TextStyle(color: Colors.white60))
                                      : null,
                                  onTap: () => Navigator.of(context)
                                      .push(MaterialPageRoute(builder: (_) => RouteDetailScreen(routeId: route.id))),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
