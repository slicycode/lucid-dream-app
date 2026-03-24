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

const deviceLocale = Localization.getLocales()[0]?.languageTag ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
      'pt-BR': { translation: ptBR },
      es: { translation: es },
      ja: { translation: ja },
      ko: { translation: ko },
    },
    lng: deviceLocale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });

export default i18n;
