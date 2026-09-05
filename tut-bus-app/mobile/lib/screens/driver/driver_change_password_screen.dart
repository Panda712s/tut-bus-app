import 'package:flutter/material.dart';
import '../../services/api_exception.dart';
import '../../services/driver_repository.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/tut_background.dart';

const _accent = Color(0xFF0A5796);
const _muted = Color(0xFF8A90A2);
const _success = Color(0xFF16A34A);

class DriverChangePasswordScreen extends StatefulWidget {
  const DriverChangePasswordScreen({super.key});

  @override
  State<DriverChangePasswordScreen> createState() =>
      _DriverChangePasswordScreenState();
}

class _DriverChangePasswordScreenState
    extends State<DriverChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();
  final _repo = DriverRepository();

  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      await _repo.changeMyPassword(
        currentPassword: _currentController.text,
        newPassword: _newController.text,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password updated.')),
        );
        Navigator.of(context).pop();
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not update your password: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final longEnough = _newController.text.length >= 8;
    final match = _confirmController.text.isNotEmpty &&
        _confirmController.text == _newController.text;

    return Scaffold(
      appBar: AppBar(title: const Text('Change password')),
      body: TutBackground(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              Center(
                child: Container(
                  height: 64,
                  width: 64,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                      color: const Color(0x140A5796),
                      borderRadius: BorderRadius.circular(20)),
                  child: const Icon(Icons.shield_outlined,
                      color: _accent, size: 30),
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'Update your password',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.2),
              ),
              const SizedBox(height: 6),
              const Text(
                'You’ll need your current password to confirm the change.',
                textAlign: TextAlign.center,
                style: TextStyle(color: _muted, fontSize: 13.5, height: 1.4),
              ),
              const SizedBox(height: 24),
              if (_error != null) ...[
                Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0x14EF4444),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0x33EF4444)),
                  ),
                  child: Text(
                    _error!,
                    style: const TextStyle(
                        color: Color(0xFFDC2626),
                        fontSize: 13,
                        fontWeight: FontWeight.w500),
                  ),
                ),
                const SizedBox(height: 16),
              ],
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Column(
                  children: [
                    TextFormField(
                      controller: _currentController,
                      obscureText: _obscureCurrent,
                      decoration: InputDecoration(
                        labelText: 'Current password',
                        prefixIcon: const Icon(Icons.lock_outline_rounded),
                        suffixIcon: IconButton(
                          icon: Icon(_obscureCurrent
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined),
                          onPressed: () => setState(
                              () => _obscureCurrent = !_obscureCurrent),
                        ),
                      ),
                      validator: (v) => (v == null || v.isEmpty)
                          ? 'Enter your current password'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _newController,
                      obscureText: _obscureNew,
                      onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(
                        labelText: 'New password',
                        prefixIcon: const Icon(Icons.lock_reset_rounded),
                        suffixIcon: IconButton(
                          icon: Icon(_obscureNew
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined),
                          onPressed: () =>
                              setState(() => _obscureNew = !_obscureNew),
                        ),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) {
                          return 'Enter a new password';
                        }
                        if (v.length < 8) {
                          return 'Must be at least 8 characters';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 8),
                    _Requirement(
                        label: 'At least 8 characters', met: longEnough),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _confirmController,
                      obscureText: _obscureNew,
                      onChanged: (_) => setState(() {}),
                      decoration: const InputDecoration(
                        labelText: 'Confirm new password',
                        prefixIcon: Icon(Icons.check_circle_outline_rounded),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) {
                          return 'Confirm your new password';
                        }
                        if (v != _newController.text) {
                          return 'Passwords do not match';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 8),
                    _Requirement(label: 'Passwords match', met: match),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              PrimaryButton(
                  label: 'Update password',
                  loading: _loading,
                  onPressed: _submit),
            ],
          ),
        ),
      ),
    );
  }
}

class _Requirement extends StatelessWidget {
  const _Requirement({required this.label, required this.met});
  final String label;
  final bool met;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          met ? Icons.check_circle_rounded : Icons.circle_outlined,
          size: 15,
          color: met ? _success : _muted,
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
              fontSize: 12,
              color: met ? _success : _muted,
              fontWeight: met ? FontWeight.w600 : FontWeight.w400),
        ),
      ],
    );
  }
}
