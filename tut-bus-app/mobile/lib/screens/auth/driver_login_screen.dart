import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../l10n/app_l10n.dart';
import '../../services/api_exception.dart';
import '../../services/remembered_credentials.dart';
import '../../state/auth_state.dart';
import '../../widgets/auth_backdrop.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/remember_me_toggle.dart';

class DriverLoginScreen extends StatefulWidget {
  const DriverLoginScreen({super.key});

  @override
  State<DriverLoginScreen> createState() => _DriverLoginScreenState();
}

class _DriverLoginScreenState extends State<DriverLoginScreen> {
  static const _role = 'driver';

  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _remembered = RememberedCredentials();
  bool _loading = false;
  bool _remember = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _remembered.load(_role).then((saved) {
      if (saved == null || !mounted) return;
      setState(() {
        _emailController.text = saved.email;
        _passwordController.text = saved.password;
      });
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
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
      final password = _passwordController.text;
      await context.read<AuthState>().signInDriver(email, password);
      if (_remember) {
        await _remembered.save(role: _role, email: email, password: password);
      } else {
        await _remembered.clear(_role);
      }
      if (!mounted) return;
      // Clear the auth screens so RootRouter's driver shell becomes visible.
      Navigator.of(context).popUntil((r) => r.isFirst);
    } catch (e) {
      setState(() => _error =
          e is ApiException ? e.message : AppL10n.of(context).t('error.loginFailed'));
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
                  title: t('auth.driverLogin.title'),
                  subtitle: t('auth.driverLogin.subtitle'),
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: t('common.email'),
                    prefixIcon: const Icon(Icons.mail_outline_rounded),
                  ),
                  validator: (v) =>
                      (v == null || !v.contains('@')) ? t('validation.invalidEmail') : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: InputDecoration(
                    labelText: t('common.password'),
                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                  ),
                  validator: (v) =>
                      (v == null || v.isEmpty) ? t('validation.passwordRequired') : null,
                ),
                const SizedBox(height: 6),
                Align(
                  alignment: Alignment.centerLeft,
                  child: RememberMeToggle(
                    value: _remember,
                    onChanged: (v) => setState(() => _remember = v),
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  _ErrorBanner(message: _error!),
                ],
                const SizedBox(height: 20),
                PrimaryButton(label: t('action.signIn'), loading: _loading, onPressed: _submit),
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
