import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';

/// Circular student avatar. Renders [imageUrl] (an https URL or a
/// `data:image/...;base64,...` URI) when present, otherwise the first
/// letter of [name] on a TUT-blue background.
class StudentAvatar extends StatelessWidget {
  const StudentAvatar({super.key, this.imageUrl, required this.name, this.radius = 38});

  final String? imageUrl;
  final String name;
  final double radius;

  static Uint8List? _decodeDataUri(String url) {
    final marker = 'base64,';
    final i = url.indexOf(marker);
    if (i == -1) return null;
    try {
      return base64Decode(url.substring(i + marker.length));
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final url = imageUrl?.trim();
    ImageProvider? image;
    if (url != null && url.isNotEmpty) {
      if (url.startsWith('data:')) {
        final bytes = _decodeDataUri(url);
        if (bytes != null) image = MemoryImage(bytes);
      } else if (url.startsWith('http')) {
        image = NetworkImage(url);
      }
    }

    return CircleAvatar(
      radius: radius,
      backgroundColor: const Color(0xFF0A5796),
      foregroundImage: image,
      child: image == null
          ? Text(
              name.isNotEmpty ? name[0].toUpperCase() : '?',
              style: TextStyle(color: Colors.white, fontSize: radius * 0.8, fontWeight: FontWeight.bold),
            )
          : null,
    );
  }
}
