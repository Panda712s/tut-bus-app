import 'package:flutter/material.dart';
import '../../models/user_models.dart';
import '../../services/student_repository.dart';
import '../../widgets/primary_button.dart';

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
  bool _loading = false;

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      await _repo.updateMyProfile(fullName: _nameController.text.trim(), phone: _phoneController.text.trim());
      if (mounted) Navigator.of(context).pop();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Full name', border: OutlineInputBorder())),
            const SizedBox(height: 14),
            TextField(controller: _phoneController, decoration: const InputDecoration(labelText: 'Phone', border: OutlineInputBorder())),
            const SizedBox(height: 20),
            PrimaryButton(label: 'Save changes', loading: _loading, onPressed: _save),
          ],
        ),
      ),
    );
  }
}
