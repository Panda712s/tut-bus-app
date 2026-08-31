import 'package:flutter/material.dart';
import '../services/ratings_repository.dart';

/// Shows the post-trip rating bottom sheet. Returns true if a rating was
/// submitted. [isDriver] switches between the rider->driver and
/// driver->trip tag sets and copy.
Future<bool> showRatingSheet(
  BuildContext context, {
  required String tripId,
  required bool isDriver,
}) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: _RatingSheet(tripId: tripId, isDriver: isDriver),
    ),
  );
  return result ?? false;
}

class _RatingSheet extends StatefulWidget {
  const _RatingSheet({required this.tripId, required this.isDriver});

  final String tripId;
  final bool isDriver;

  @override
  State<_RatingSheet> createState() => _RatingSheetState();
}

class _RatingSheetState extends State<_RatingSheet> {
  final _repo = RatingsRepository();
  final _commentCtrl = TextEditingController();

  int _score = 0;
  final Set<String> _selectedTags = {};
  List<String> _tagOptions = const [];
  bool _loadingTags = true;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _repo.fetchTags().then((t) {
      if (!mounted) return;
      setState(() {
        _tagOptions = widget.isDriver ? t.driverToTrip : t.studentToDriver;
        _loadingTags = false;
      });
    }).catchError((_) {
      if (mounted) setState(() => _loadingTags = false);
    });
  }

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_score == 0) {
      setState(() => _error = 'Tap a star to give a rating.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await _repo.submit(
        tripId: widget.tripId,
        score: _score,
        tags: _selectedTags.toList(),
        comment: _commentCtrl.text.trim(),
      );
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = '$e';
          _submitting = false;
        });
      }
    }
  }

  String _prettyTag(String t) => t.replaceAll('_', ' ').toLowerCase();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.isDriver ? 'How did the trip go?' : 'Rate your trip',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            widget.isDriver
                ? 'Your feedback helps dispatch spot recurring problems.'
                : 'Your rating is shared with the driver and campus transport.',
            style: const TextStyle(color: Colors.black54, fontSize: 13),
          ),
          const SizedBox(height: 16),
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(5, (i) {
                final filled = i < _score;
                return IconButton(
                  iconSize: 40,
                  onPressed: () => setState(() => _score = i + 1),
                  icon: Icon(
                    filled ? Icons.star_rounded : Icons.star_border_rounded,
                    color: filled ? const Color(0xFFF59E0B) : Colors.black26,
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 8),
          if (_loadingTags)
            const Center(child: Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator(strokeWidth: 2)))
          else if (_tagOptions.isNotEmpty)
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _tagOptions.map((tag) {
                final selected = _selectedTags.contains(tag);
                return FilterChip(
                  label: Text(_prettyTag(tag)),
                  selected: selected,
                  onSelected: (v) => setState(() {
                    if (v) {
                      _selectedTags.add(tag);
                    } else {
                      _selectedTags.remove(tag);
                    }
                  }),
                );
              }).toList(),
            ),
          const SizedBox(height: 16),
          TextField(
            controller: _commentCtrl,
            maxLines: 3,
            maxLength: 500,
            decoration: const InputDecoration(
              hintText: 'Add a comment (optional)',
              alignLabelWithHint: true,
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 4, bottom: 8),
              child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13)),
            ),
          const SizedBox(height: 4),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Submit rating'),
            ),
          ),
          TextButton(
            onPressed: _submitting ? null : () => Navigator.pop(context, false),
            child: const Text('Not now'),
          ),
        ],
      ),
    );
  }
}
