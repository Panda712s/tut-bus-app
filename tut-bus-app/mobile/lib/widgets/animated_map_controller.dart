import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

/// Wraps a flutter_map [MapController] so camera moves ease to their
/// destination instead of the hard, single-frame jump `MapController.move()`
/// does by default - the difference between a map that feels responsive and
/// one that feels like it's teleporting every time a GPS fix comes in.
class AnimatedMapController {
  AnimatedMapController({required this.mapController, required TickerProvider vsync}) : _vsync = vsync;

  final MapController mapController;
  final TickerProvider _vsync;
  AnimationController? _controller;

  void animateTo({
    required LatLng dest,
    double? zoom,
    Duration duration = const Duration(milliseconds: 500),
    Curve curve = Curves.easeInOutCubic,
  }) {
    _controller?.dispose();
    final camera = mapController.camera;
    final latTween = Tween<double>(begin: camera.center.latitude, end: dest.latitude);
    final lngTween = Tween<double>(begin: camera.center.longitude, end: dest.longitude);
    final zoomTween = Tween<double>(begin: camera.zoom, end: zoom ?? camera.zoom);

    final controller = AnimationController(duration: duration, vsync: _vsync);
    final curved = CurvedAnimation(parent: controller, curve: curve);
    _controller = controller;

    controller.addListener(() {
      mapController.move(LatLng(latTween.evaluate(curved), lngTween.evaluate(curved)), zoomTween.evaluate(curved));
    });
    controller.forward().whenCompleteOrCancel(() {
      controller.dispose();
      if (identical(_controller, controller)) _controller = null;
    });
  }

  void dispose() {
    _controller?.dispose();
  }
}
