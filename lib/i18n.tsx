import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {SYSTEMS,type SystemId} from '@/app/anatomy';
import {en, type Dictionary} from './i18n-dict-en';
import {ru} from './i18n-dict-ru';

export type Locale = 'en' | 'ru';

const STORAGE_KEY = 'human-atlas-locale';

const dictionaries: Record<Locale, Dictionary> = {en, ru};

type Params = Record<string, string | number>;

function format(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  );
}

function lookup(locale: Locale, key: string): string | undefined {
  return dictionaries[locale][key] ?? dictionaries.en[key];
}

export function translate(locale: Locale, key: string, params?: Params): string {
  return format(lookup(locale, key) ?? key, params);
}

export function translatedExplanation(locale: Locale, name: string, system: SystemId): string {
  const specific = lookup(locale, `explanations.${name.toLowerCase()}`);
  if (specific) return specific;
  return lookup(locale, `systems.${system}.description`) ?? '';
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Params) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'ru';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ru') return stored;
  } catch {
    /* ignore */
  }
  return 'ru';
}

export function LocaleProvider({children}: {children: ReactNode}) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((key: string, params?: Params) => translate(locale, key, params), [locale]);

  const value = useMemo(() => ({locale, setLocale, t}), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export function useT(): LocaleContextValue {
  return useLocale();
}

export function useTranslatedSystems() {
  const {t} = useT();
  return useMemo(
    () =>
      SYSTEMS.map(system => ({
        ...system,
        name: t(`systems.${system.id}.name`),
        description: t(`systems.${system.id}.description`),
      })),
    [t],
  );
}
