import 'api_service.dart';

class FeedbackRepository {
  FeedbackRepository({ApiService? api}) : _api = api ?? ApiService();

  final ApiService _api;

  Future<void> submit({
    required String category, // DRIVER_RATING | ISSUE_REPORT | SUGGESTION
    int? rating,
    String? comment,
    String? tripId,
  }) {
    return _api.post('/feedback', {
      'category': category,
      if (rating != null) 'rating': rating,
      if (comment != null && comment.isNotEmpty) 'comment': comment,
      if (tripId != null) 'tripId': tripId,
    });
  }
}
