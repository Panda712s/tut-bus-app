import 'package:flutter/material.dart';
import '../../services/driver_repository.dart';
import '../../widgets/primary_button.dart';

const _types = {
  'TRAFFIC': 'Traffic delay',
  'ACCIDENT': 'Accident',
  'BREAKDOWN': 'Bus breakdown',
  'DELAY': 'Other delay',
  'OTHER': 'Other',
};

class DriverIncidentScreen extends StatefulWidget {
  const DriverIncidentScreen({super.key, this.tripId});

  final String? tripId;

  @override
  State<DriverIncidentScreen> createState() => _DriverIncidentScreenState();
}

class _DriverIncidentScreenState extends State<DriverIncidentScreen> {
  final _repo = DriverRepository();
  final _descriptionController = TextEditingController();
  String _type = 'TRAFFIC';
  bool _loading = false;
  String? _message;

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      await _repo.reportIncident(type: _type, description: _descriptionController.text.trim(), tripId: widget.tripId);
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Report submitted. Students on this route will be notified.')));
      }
    } catch (e) {
      setState(() => _message = 'Could not submit report: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Report an issue')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Type', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _types.entries
                  .map((e) => ChoiceChip(label: Text(e.value), selected: _type == e.key, onSelected: (_) => setState(() => _type = e.key)))
                  .toList(),
            ),
            const SizedBox(height: 20),
            const Text('Description (optional)', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: const InputDecoration(hintText: 'What happened?'),
            ),
            if (_message != null) ...[
              const SizedBox(height: 12),
              Text(_message!, style: const TextStyle(color: Color(0xFFDC2626))),
            ],
            const SizedBox(height: 20),
            PrimaryButton(label: 'Submit report', loading: _loading, onPressed: _submit),
          ],
        ),
      ),
    );
  }
}
