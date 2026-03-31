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

import ddEn from '../locales/dreamDictionary/en.json';
import ddFr from '../locales/dreamDictionary/fr.json';
import ddDe from '../locales/dreamDictionary/de.json';
import ddPtBR from '../locales/dreamDictionary/pt-BR.json';
import ddEs from '../locales/dreamDictionary/es.json';
import ddJa from '../locales/dreamDictionary/ja.json';
import ddKo from '../locales/dreamDictionary/ko.json';

import oiEn from '../locales/onboardingInterpretations/en.json';
import oiFr from '../locales/onboardingInterpretations/fr.json';
import oiDe from '../locales/onboardingInterpretations/de.json';
import oiPtBR from '../locales/onboardingInterpretations/pt-BR.json';
import oiEs from '../locales/onboardingInterpretations/es.json';
import oiJa from '../locales/onboardingInterpretations/ja.json';
import oiKo from '../locales/onboardingInterpretations/ko.json';

const deviceLocale = Localization.getLocales()[0]?.languageTag ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en, dailyInsights: diEn, dreamDictionary: ddEn, onboardingInterpretations: oiEn },
      fr: { translation: fr, dailyInsights: diFr, dreamDictionary: ddFr, onboardingInterpretations: oiFr },
      de: { translation: de, dailyInsights: diDe, dreamDictionary: ddDe, onboardingInterpretations: oiDe },
      'pt-BR': { translation: ptBR, dailyInsights: diPtBR, dreamDictionary: ddPtBR, onboardingInterpretations: oiPtBR },
      es: { translation: es, dailyInsights: diEs, dreamDictionary: ddEs, onboardingInterpretations: oiEs },
      ja: { translation: ja, dailyInsights: diJa, dreamDictionary: ddJa, onboardingInterpretations: oiJa },
      ko: { translation: ko, dailyInsights: diKo, dreamDictionary: ddKo, onboardingInterpretations: oiKo },
    },
    lng: deviceLocale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
    ns: ['translation', 'dailyInsights', 'dreamDictionary', 'onboardingInterpretations'],
    defaultNS: 'translation',
  });

export default i18n;
