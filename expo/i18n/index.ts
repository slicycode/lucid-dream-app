import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from '../locales/en.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import ptBR from '../locales/pt-BR.json';
import es from '../locales/es.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';

import diEn from '../locales/dailyInsights/en.json';
import diFr from '../locales/dailyInsights/fr.json';
import diDe from '../locales/dailyInsights/de.json';
import diPtBR from '../locales/dailyInsights/pt-BR.json';
import diEs from '../locales/dailyInsights/es.json';
import diJa from '../locales/dailyInsights/ja.json';
import diKo from '../locales/dailyInsights/ko.json';

const deviceLocale = Localization.getLocales()[0]?.languageTag ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en, dailyInsights: diEn },
      fr: { translation: fr, dailyInsights: diFr },
      de: { translation: de, dailyInsights: diDe },
      'pt-BR': { translation: ptBR, dailyInsights: diPtBR },
      es: { translation: es, dailyInsights: diEs },
      ja: { translation: ja, dailyInsights: diJa },
      ko: { translation: ko, dailyInsights: diKo },
    },
    lng: deviceLocale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
    ns: ['translation', 'dailyInsights'],
    defaultNS: 'translation',
  });

export default i18n;
