import 'package:flutter/widgets.dart';

/// Lightweight in-app translation table.
///
/// Covers the Settings screen, the bottom-navigation labels and a handful of
/// shared actions in the five languages most relevant to TUT. Any key that is
/// missing for the active language falls back to English, so screens that
/// haven't been translated yet keep working. Full string extraction for every
/// screen (via ARB / `flutter gen-l10n`) is the documented follow-up.
class AppL10n {
  AppL10n(this.locale);

  final Locale locale;

  static AppL10n of(BuildContext context) =>
      Localizations.of<AppL10n>(context, AppL10n) ?? AppL10n(const Locale('en'));

  static const LocalizationsDelegate<AppL10n> delegate = _AppL10nDelegate();

  /// Languages offered in the picker (code → English name / native name).
  static const List<LanguageOption> languages = [
    LanguageOption('en', 'English', 'English'),
    LanguageOption('af', 'Afrikaans', 'Afrikaans'),
    LanguageOption('zu', 'isiZulu', 'isiZulu'),
    LanguageOption('xh', 'isiXhosa', 'isiXhosa'),
    LanguageOption('st', 'Sesotho', 'Sesotho'),
  ];

  static List<Locale> get supportedLocales =>
      languages.map((l) => Locale(l.code)).toList(growable: false);

  String t(String key) {
    final lang = _table[locale.languageCode] ?? const {};
    return lang[key] ?? _table['en']![key] ?? key;
  }

  static const Map<String, Map<String, String>> _table = {
    'en': {
      'settings.title': 'Settings',
      'settings.appearance': 'Appearance',
      'settings.appearance.desc': 'Choose how the app looks',
      'settings.theme.system': 'System default',
      'settings.theme.light': 'Light',
      'settings.theme.dark': 'Dark (night mode)',
      'settings.language': 'Language',
      'settings.language.desc': 'Choose your preferred language',
      'settings.language.system': 'Device language',
      'settings.about': 'About',
      'settings.version': 'Version',
      'common.settings': 'Settings',
      'nav.home': 'Home',
      'nav.map': 'Live Map',
      'nav.routes': 'Routes',
      'nav.alerts': 'Alerts',
      'nav.profile': 'Profile',
      'nav.trip': 'Trip',
      'action.signOut': 'Sign out',
      'action.save': 'Save',
      'action.cancel': 'Cancel',
      'action.retry': 'Try again',
    },
    'af': {
      'settings.title': 'Instellings',
      'settings.appearance': 'Voorkoms',
      'settings.appearance.desc': 'Kies hoe die program lyk',
      'settings.theme.system': 'Stelselverstek',
      'settings.theme.light': 'Lig',
      'settings.theme.dark': 'Donker (nagmodus)',
      'settings.language': 'Taal',
      'settings.language.desc': 'Kies jou voorkeurtaal',
      'settings.language.system': 'Toesteltaal',
      'settings.about': 'Aangaande',
      'settings.version': 'Weergawe',
      'common.settings': 'Instellings',
      'nav.home': 'Tuis',
      'nav.map': 'Lewende kaart',
      'nav.routes': 'Roetes',
      'nav.alerts': 'Kennisgewings',
      'nav.profile': 'Profiel',
      'nav.trip': 'Rit',
      'action.signOut': 'Meld af',
      'action.save': 'Stoor',
      'action.cancel': 'Kanselleer',
      'action.retry': 'Probeer weer',
    },
    'zu': {
      'settings.title': 'Izilungiselelo',
      'settings.appearance': 'Ukubukeka',
      'settings.appearance.desc': 'Khetha indlela uhlelo olubukeka ngayo',
      'settings.theme.system': 'Okuzenzakalelayo kwesistimu',
      'settings.theme.light': 'Okukhanyayo',
      'settings.theme.dark': 'Okumnyama (imodi yasebusuku)',
      'settings.language': 'Ulimi',
      'settings.language.desc': 'Khetha ulimi oluthandayo',
      'settings.language.system': 'Ulimi lwedivayisi',
      'settings.about': 'Mayelana',
      'settings.version': 'Inguqulo',
      'common.settings': 'Izilungiselelo',
      'nav.home': 'Ikhaya',
      'nav.map': 'Imephu ebukhoma',
      'nav.routes': 'Imizila',
      'nav.alerts': 'Izexwayiso',
      'nav.profile': 'Iphrofayela',
      'nav.trip': 'Uhambo',
      'action.signOut': 'Phuma',
      'action.save': 'Londoloza',
      'action.cancel': 'Khansela',
      'action.retry': 'Zama futhi',
    },
    'xh': {
      'settings.title': 'Iisetingi',
      'settings.appearance': 'Inkangeleko',
      'settings.appearance.desc': 'Khetha indlela usetyenziso olukhangeleka ngayo',
      'settings.theme.system': 'Okumiselweyo kwenkqubo',
      'settings.theme.light': 'Ukukhanya',
      'settings.theme.dark': 'Ubumnyama (imowudi yasebusuku)',
      'settings.language': 'Ulwimi',
      'settings.language.desc': 'Khetha ulwimi oluthandayo',
      'settings.language.system': 'Ulwimi lwesixhobo',
      'settings.about': 'Malunga',
      'settings.version': 'Inguqulelo',
      'common.settings': 'Iisetingi',
      'nav.home': 'Ikhaya',
      'nav.map': 'Imephu ephilayo',
      'nav.routes': 'Iindlela',
      'nav.alerts': 'Izilumkiso',
      'nav.profile': 'Iprofayile',
      'nav.trip': 'Uhambo',
      'action.signOut': 'Phuma',
      'action.save': 'Gcina',
      'action.cancel': 'Rhoxisa',
      'action.retry': 'Zama kwakhona',
    },
    'st': {
      'settings.title': 'Litlhophiso',
      'settings.appearance': 'Ponahalo',
      'settings.appearance.desc': 'Kgetha kamoo sesebediswa se shebahalang',
      'settings.theme.system': 'Tlwaelo ya sistimi',
      'settings.theme.light': 'E kganyang',
      'settings.theme.dark': 'E lefifi (mokgwa wa bosiu)',
      'settings.language': 'Puo',
      'settings.language.desc': 'Kgetha puo eo o e ratang',
      'settings.language.system': 'Puo ya sesebediswa',
      'settings.about': 'Mabapi le',
      'settings.version': 'Mofuta',
      'common.settings': 'Litlhophiso',
      'nav.home': 'Lehae',
      'nav.map': 'Mmapa o phelang',
      'nav.routes': 'Ditsela',
      'nav.alerts': 'Ditlhokomediso',
      'nav.profile': 'Profaele',
      'nav.trip': 'Leeto',
      'action.signOut': 'Tswa',
      'action.save': 'Boloka',
      'action.cancel': 'Hlakola',
      'action.retry': 'Leka hape',
    },
  };
}

class LanguageOption {
  const LanguageOption(this.code, this.englishName, this.nativeName);
  final String code;
  final String englishName;
  final String nativeName;
}

class _AppL10nDelegate extends LocalizationsDelegate<AppL10n> {
  const _AppL10nDelegate();

  @override
  bool isSupported(Locale locale) =>
      AppL10n.languages.any((l) => l.code == locale.languageCode);

  @override
  Future<AppL10n> load(Locale locale) async => AppL10n(locale);

  @override
  bool shouldReload(_AppL10nDelegate old) => false;
}
