import 'package:flutter/material.dart';

import '../l10n/app_l10n.dart';

/// Compact "Remember my details" checkbox used on the login screens.
class RememberMeToggle extends StatelessWidget {
  const RememberMeToggle({super.key, required this.value, required this.onChanged});

  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!value),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 22,
              height: 22,
              child: Checkbox(
                value: value,
                onChanged: (v) => onChanged(v ?? false),
                visualDensity: VisualDensity.compact,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                AppL10n.of(context).t('auth.rememberMe'),
                style: const TextStyle(fontSize: 13, color: Color(0xFF8A90A2)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
