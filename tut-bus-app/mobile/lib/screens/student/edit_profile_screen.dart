import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../models/user_models.dart';
import '../../services/student_repository.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/student_avatar.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key, required this.profile});

  final StudentProfile? profile;

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _repo = StudentRepository();
  late final _nameController = TextEditingController(text: widget.profile?.fullName ?? '');
  late final _phoneController = TextEditingController(text: widget.profile?.phone ?? '');
  late String? _imageUrl = widget.profile?.profileImageUrl;
  bool _loading = false;
  bool _picking = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    setState(() => _picking = true);
    try {
      final file = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 72,
      );
      if (file == null) return;
      final bytes = await file.readAsBytes();
      if (bytes.lengthInBytes > 4 * 1024 * 1024) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('That image is too large. Pick a smaller one.')),
          );
        }
        return;
      }
      final ext = file.name.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
      setState(() => _imageUrl = 'data:image/$ext;base64,${base64Encode(bytes)}');
    } finally {
      if (mounted) setState(() => _picking = false);
    }
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      await _repo.updateMyProfile(
        fullName: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        profileImageUrl: _imageUrl,
      );
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not save: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          Center(
            child: Stack(
              children: [
                StudentAvatar(
                  imageUrl: _imageUrl,
                  name: _nameController.text,
                  radius: 48,
                ),
                Positioned(
                  right: -2,
                  bottom: -2,
                  child: Material(
                    color: const Color(0xFF0A5796),
                    shape: const CircleBorder(),
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: _picking ? null : _pickImage,
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: _picking
                            ? const SizedBox(
                                width: 16, height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.camera_alt_rounded, size: 16, color: Colors.white),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Center(
            child: TextButton(
              onPressed: _picking ? null : _pickImage,
              child: Text(_imageUrl == null ? 'Add a photo' : 'Change photo'),
            ),
          ),
          if (_imageUrl != null)
            Center(
              child: TextButton(
                onPressed: () => setState(() => _imageUrl = null),
                style: TextButton.styleFrom(foregroundColor: const Color(0xFFEF4444)),
                child: const Text('Remove photo'),
              ),
            ),
          const SizedBox(height: 20),
          TextField(
            controller: _nameController,
            textCapitalization: TextCapitalization.words,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              labelText: 'Full name',
              prefixIcon: Icon(Icons.person_outline_rounded),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Phone',
              prefixIcon: Icon(Icons.phone_outlined),
            ),
          ),
          const SizedBox(height: 24),
          PrimaryButton(label: 'Save changes', loading: _loading, onPressed: _save),
        ],
      ),
    );
  }
}
