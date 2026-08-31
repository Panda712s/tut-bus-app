import 'package:flutter/material.dart';
import '../../services/api_exception.dart';
import '../../services/auth_service.dart';
import '../../widgets/primary_button.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _authService = AuthService();
  final _emailController = TextEditingController();
  final _codeController = TextEditingController();
  final _newPasswordController = TextEditingController();
  bool _codeRequested = false;
  bool _loading = false;
  String? _message;
  bool _isError = false;

  Future<void> _requestCode() async {
    if (_emailController.text.trim().isEmpty) return;
    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      await _authService.requestStudentPasswordReset(_emailController.text.trim());
      setState(() {
        _codeRequested = true;
        _message = 'If that email is registered, a reset code has been sent.';
        _isError = false;
      });
    } catch (e) {
      setState(() {
        _message = e is ApiException ? e.message : 'Something went wrong.';
        _isError = true;
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resetPassword() async {
    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      await _authService.resetStudentPassword(
        email: _emailController.text.trim(),
        code: _codeController.text.trim(),
        newPassword: _newPasswordController.text,
      );
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password reset. Please sign in with your new password.')),
      );
    } catch (e) {
      setState(() {
        _message = e is ApiException ? e.message : 'Reset failed. Please try again.';
        _isError = true;
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset password')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _emailController,
                enabled: !_codeRequested,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'TUT email', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 14),
              if (!_codeRequested)
                PrimaryButton(label: 'Send reset code', loading: _loading, onPressed: _requestCode)
              else ...[
                TextField(
                  controller: _codeController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Reset code', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _newPasswordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'New password', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 14),
                PrimaryButton(label: 'Reset password', loading: _loading, onPressed: _resetPassword),
              ],
              if (_message != null) ...[
                const SizedBox(height: 14),
                Text(_message!, style: TextStyle(color: _isError ? Colors.red : Colors.green)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
