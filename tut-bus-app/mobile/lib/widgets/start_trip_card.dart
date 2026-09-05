import 'package:flutter/material.dart';
import '../models/transport_models.dart';
import 'primary_button.dart';

const _accent = Color(0xFF0A5796);

/// Route picker + start button shown on the driver dashboard when the driver
/// has a bus assigned but no trip currently in progress.
class StartTripCard extends StatelessWidget {
  const StartTripCard({
    super.key,
    required this.routes,
    required this.selectedRouteId,
    required this.onRouteChanged,
    required this.starting,
    required this.onStart,
  });

  final List<BusRoute> routes;
  final String? selectedRouteId;
  final ValueChanged<String?> onRouteChanged;
  final bool starting;
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 34,
                width: 34,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: const Color(0x140A5796), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.route_rounded, size: 18, color: _accent),
              ),
              const SizedBox(width: 10),
              const Text('Start a new trip', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5)),
            ],
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: selectedRouteId,
            decoration: const InputDecoration(labelText: 'Route'),
            items: routes.map((r) => DropdownMenuItem(value: r.id, child: Text(r.name))).toList(),
            onChanged: onRouteChanged,
          ),
          const SizedBox(height: 18),
          PrimaryButton(label: 'Start trip', loading: starting, onPressed: onStart),
        ],
      ),
    );
  }
}
