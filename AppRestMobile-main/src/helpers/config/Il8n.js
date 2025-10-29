// i18n.js
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import en from '../../assets/locales/en.json';
import es from '../../assets/locales/es.json';

const resources = {
  en: {translation: en},
  es: {translation: es},
};

i18n.use(initReactI18next).init({
  resources,
  lng: RNLocalize.getLocales()[0].languageCode,
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
