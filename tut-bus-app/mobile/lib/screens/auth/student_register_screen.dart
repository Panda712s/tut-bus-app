import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../l10n/app_l10n.dart';
import '../../services/api_exception.dart';
import '../../state/auth_state.dart';
import '../../utils/email_validation.dart';
import '../../widgets/auth_backdrop.dart';
import '../../widgets/primary_button.dart';
import 'otp_verification_screen.dart';

class StudentRegisterScreen extends StatefulWidget {
  const StudentRegisterScreen({super.key});

  @override
  State<StudentRegisterScreen> createState() => _StudentRegisterScreenState();
}

class _StudentRegisterScreenState extends State<StudentRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _studentNumberController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    _studentNumberController.dispose();
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final email = _emailController.text.trim();
      final signedIn = await context.read<AuthState>().registerStudent(
            studentNumber: _studentNumberController.text.trim(),
            fullName: _fullNameController.text.trim(),
            email: email,
            password: _passwordController.text,
            phone: _phoneController.text.trim(),
          );
      if (!mounted) return;
      if (signedIn) {
        // RootRouter reacts to the auth-state change and shows the student shell.
        Navigator.of(context).popUntil((r) => r.isFirst);
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => OtpVerificationScreen(email: email)),
        );
      }
    } catch (e) {
      setState(() => _error =
          e is ApiException ? e.message : AppL10n.of(context).t('error.registrationFailed'));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppL10n.of(context).t;
    return Scaffold(
      appBar: AppBar(backgroundColor: Colors.transparent),
      extendBodyBehindAppBar: true,
      body: AuthBackdrop(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AuthHeader(
                  title: t('auth.studentRegister.title'),
                  subtitle: t('auth.studentRegister.subtitle'),
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _studentNumberController,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: t('auth.studentRegister.studentNumber'),
                    prefixIcon: const Icon(Icons.badge_outlined),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? t('common.required') : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _fullNameController,
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: t('auth.studentRegister.fullName'),
                    prefixIcon: const Icon(Icons.person_outline_rounded),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? t('common.required') : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: t('auth.studentLogin.emailLabel'),
                    hintText: 'yourname@tut4life.ac.za',
                    prefixIcon: const Icon(Icons.mail_outline_rounded),
                  ),
                  validator: validateTutStudentEmail,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: t('common.password'),
                    helperText: t('auth.studentRegister.passwordMin'),
                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                    suffixIcon: IconButton(
                      onPressed: () => setState(() => _obscure = !_obscure),
                      icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                    ),
                  ),
                  validator: (v) =>
                      (v == null || v.length < 8) ? t('auth.studentRegister.passwordMin') : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: InputDecoration(
                    labelText: t('auth.studentRegister.phone'),
                    prefixIcon: const Icon(Icons.phone_outlined),
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  _ErrorBanner(message: _error!),
                ],
                const SizedBox(height: 22),
                PrimaryButton(label: t('action.createAccount'), loading: _loading, onPressed: _submit),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(t('auth.studentRegister.alreadyRegistered'), style: const TextStyle(color: Color(0xFF8A90A2))),
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: Text(t('action.signIn')),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0x1FF87171),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x40F87171)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: Color(0xFFF87171), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message, style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
