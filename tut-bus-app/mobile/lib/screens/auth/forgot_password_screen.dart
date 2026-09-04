import 'package:flutter/material.dart';
import '../../services/api_exception.dart';
import '../../services/auth_service.dart';
import '../../widgets/auth_backdrop.dart';
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
  bool _obscure = true;
  bool _loading = false;
  String? _message;
  bool _isError = false;

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

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
      appBar: AppBar(backgroundColor: Colors.transparent),
      extendBodyBehindAppBar: true,
      body: AuthBackdrop(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AuthHeader(
                title: 'Reset password',
                subtitle: _codeRequested
                    ? 'Enter the code we sent to your email, then choose a new password'
                    : "Enter your TUT student email and we'll send you a reset code",
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _emailController,
                enabled: !_codeRequested,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _requestCode(),
                decoration: const InputDecoration(
                  labelText: 'TUT student email',
                  hintText: 'yourname@tut4life.ac.za',
                  prefixIcon: Icon(Icons.mail_outline_rounded),
                ),
              ),
              if (!_codeRequested) ...[
                if (_message != null) ...[
                  const SizedBox(height: 16),
                  _MessageBanner(message: _message!, isError: _isError),
                ],
                const SizedBox(height: 22),
                PrimaryButton(label: 'Send reset code', loading: _loading, onPressed: _requestCode),
              ] else ...[
                const SizedBox(height: 14),
                TextField(
                  controller: _codeController,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Reset code',
                    prefixIcon: Icon(Icons.pin_outlined),
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _newPasswordController,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _resetPassword(),
                  decoration: InputDecoration(
                    labelText: 'New password',
                    helperText: 'At least 8 characters',
                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                    suffixIcon: IconButton(
                      onPressed: () => setState(() => _obscure = !_obscure),
                      icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                    ),
                  ),
                ),
                if (_message != null) ...[
                  const SizedBox(height: 16),
                  _MessageBanner(message: _message!, isError: _isError),
                ],
                const SizedBox(height: 22),
                PrimaryButton(label: 'Reset password', loading: _loading, onPressed: _resetPassword),
                const SizedBox(height: 14),
                Center(
                  child: TextButton(
                    onPressed: _loading
                        ? null
                        : () => setState(() {
                              _codeRequested = false;
                              _message = null;
                            }),
                    child: const Text('Use a different email'),
                  ),
                ),
              ],
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Remembered it?', style: TextStyle(color: Color(0xFF8A90A2))),
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Sign in'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MessageBanner extends StatelessWidget {
  const _MessageBanner({required this.message, required this.isError});

  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final color = isError ? const Color(0xFFF87171) : const Color(0xFF16A34A);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Icon(
            isError ? Icons.error_outline_rounded : Icons.check_circle_outline_rounded,
            color: color,
            size: 18,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message, style: TextStyle(color: color, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
