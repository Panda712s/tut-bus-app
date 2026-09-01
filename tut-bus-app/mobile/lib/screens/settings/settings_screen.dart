import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../l10n/app_l10n.dart';
import '../../state/settings_controller.dart';
import '../../theme/app_theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppL10n.of(context);
    final settings = context.watch<SettingsController>();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(l.t('settings.title'))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        children: [
          _SectionHeader(title: l.t('settings.appearance'), subtitle: l.t('settings.appearance.desc')),
          Card(
            child: Column(
              children: [
                _ThemeOption(
                  label: l.t('settings.theme.system'),
                  icon: Icons.brightness_auto_rounded,
                  value: ThemeMode.system,
                  groupValue: settings.themeMode,
                  onChanged: settings.setThemeMode,
                ),
                Divider(height: 1, color: theme.dividerColor),
                _ThemeOption(
                  label: l.t('settings.theme.light'),
                  icon: Icons.light_mode_rounded,
                  value: ThemeMode.light,
                  groupValue: settings.themeMode,
                  onChanged: settings.setThemeMode,
                ),
                Divider(height: 1, color: theme.dividerColor),
                _ThemeOption(
                  label: l.t('settings.theme.dark'),
                  icon: Icons.dark_mode_rounded,
                  value: ThemeMode.dark,
                  groupValue: settings.themeMode,
                  onChanged: settings.setThemeMode,
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          _SectionHeader(title: l.t('settings.language'), subtitle: l.t('settings.language.desc')),
          Card(
            child: Column(
              children: [
                _LanguageOption(
                  label: l.t('settings.language.system'),
                  trailing: null,
                  selected: settings.locale == null,
                  onTap: () => settings.setLocale(null),
                ),
                for (final lang in AppL10n.languages) ...[
                  Divider(height: 1, color: theme.dividerColor),
                  _LanguageOption(
                    label: lang.nativeName,
                    trailing: lang.nativeName == lang.englishName ? null : lang.englishName,
                    selected: settings.locale?.languageCode == lang.code,
                    onTap: () => settings.setLocale(Locale(lang.code)),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 24),
          _SectionHeader(title: l.t('settings.about')),
          Card(
            child: ListTile(
              leading: const Icon(Icons.info_outline_rounded),
              title: Text(l.t('settings.version')),
              trailing: Text('1.0.0', style: TextStyle(color: theme.hintColor)),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 4, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: theme.hintColor,
            ),
          ),
          if (subtitle != null)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(subtitle!, style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
            ),
        ],
      ),
    );
  }
}

class _ThemeOption extends StatelessWidget {
  const _ThemeOption({
    required this.label,
    required this.icon,
    required this.value,
    required this.groupValue,
    required this.onChanged,
  });

  final String label;
  final IconData icon;
  final ThemeMode value;
  final ThemeMode groupValue;
  final ValueChanged<ThemeMode> onChanged;

  @override
  Widget build(BuildContext context) {
    return RadioListTile<ThemeMode>(
      value: value,
      groupValue: groupValue,
      onChanged: (v) => v == null ? null : onChanged(v),
      controlAffinity: ListTileControlAffinity.trailing,
      secondary: Icon(icon),
      title: Text(label),
    );
  }
}

class _LanguageOption extends StatelessWidget {
  const _LanguageOption({
    required this.label,
    required this.selected,
    required this.onTap,
    this.trailing,
  });

  final String label;
  final String? trailing;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListTile(
      onTap: onTap,
      title: Text(label),
      subtitle: trailing == null ? null : Text(trailing!, style: TextStyle(color: theme.hintColor)),
      trailing: selected
          ? const Icon(Icons.check_rounded, color: AppColors.accent)
          : null,
    );
  }
}
