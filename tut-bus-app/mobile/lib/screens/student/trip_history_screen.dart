import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/transport_models.dart';
import '../../services/transport_repository.dart';
import '../../widgets/state_views.dart';

class TripHistoryScreen extends StatefulWidget {
  const TripHistoryScreen({super.key});

  @override
  State<TripHistoryScreen> createState() => _TripHistoryScreenState();
}

class _TripHistoryScreenState extends State<TripHistoryScreen> {
  final _repo = TransportRepository();
  List<TripHistoryEntry> _entries = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final entries = await _repo.fetchTripHistory();
      setState(() => _entries = entries);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Trip history')),
      body: _loading
          ? const LoadingView()
          : _entries.isEmpty
              ? const EmptyView(message: 'No trips yet.', icon: Icons.history_outlined)
              : ListView.separated(
                  itemCount: _entries.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final e = _entries[index];
                    final duration = e.alightedAt != null ? e.alightedAt!.difference(e.boardedAt) : null;
                    return ListTile(
                      leading: const Icon(Icons.directions_bus_filled_rounded, color: Color(0xFF8B5CF6)),
                      title: Text(e.routeName ?? 'Trip'),
                      subtitle: Text(
                        '${e.busNumber ?? ''} · Boarded ${DateFormat('MMM d, HH:mm').format(e.boardedAt)}',
                      ),
                      trailing: duration != null ? Text('${duration.inMinutes} min') : const Text('In progress'),
                    );
                  },
                ),
    );
  }
}
