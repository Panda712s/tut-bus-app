import 'package:flutter/material.dart';
import '../../services/api_exception.dart';
import '../../services/feedback_repository.dart';
import '../../widgets/primary_button.dart';

const _categories = {
  'DRIVER_RATING': 'Rate a driver',
  'ISSUE_REPORT': 'Report an issue',
  'SUGGESTION': 'Suggestion',
};

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final _repo = FeedbackRepository();
  final _commentController = TextEditingController();
  String _category = 'DRIVER_RATING';
  int _rating = 5;
  bool _loading = false;
  String? _message;
  bool _isError = false;

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      await _repo.submit(
        category: _category,
        rating: _category == 'DRIVER_RATING' ? _rating : null,
        comment: _commentController.text.trim(),
      );
      setState(() {
        _message = 'Thanks! Your feedback has been submitted.';
        _isError = false;
        _commentController.clear();
      });
    } catch (e) {
      setState(() {
        _message = e is ApiException ? e.message : 'Could not submit feedback.';
        _isError = true;
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Feedback')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Category', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _categories.entries
                  .map(
                    (e) => ChoiceChip(
                      label: Text(e.value),
                      selected: _category == e.key,
                      onSelected: (_) => setState(() => _category = e.key),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 20),
            if (_category == 'DRIVER_RATING') ...[
              const Text('Rating', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Row(
                children: List.generate(5, (i) {
                  final filled = i < _rating;
                  return IconButton(
                    icon: Icon(filled ? Icons.star_rounded : Icons.star_border_rounded, color: Colors.amber, size: 32),
                    onPressed: () => setState(() => _rating = i + 1),
                  );
                }),
              ),
              const SizedBox(height: 12),
            ],
            const Text('Comments', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextField(
              controller: _commentController,
              maxLines: 4,
              decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Tell us more...'),
            ),
            if (_message != null) ...[
              const SizedBox(height: 12),
              Text(_message!, style: TextStyle(color: _isError ? Colors.red : Colors.green)),
            ],
            const SizedBox(height: 20),
            PrimaryButton(label: 'Submit feedback', loading: _loading, onPressed: _submit),
          ],
        ),
      ),
    );
  }
}
