import { create } from 'zustand';

import { getMeta, setMeta } from '@/core/db';

import { en, ko, type Messages } from './messages';

export type Locale = 'ko' | 'en';
/** auto는 기기 언어를 따른다(한국어면 한국어, 그 밖에는 영어). */
export type LanguagePref = 'auto' | Locale;

const META_KEY = 'language';

function deviceLocale(): Locale {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith('ko')
      ? 'ko'
      : 'en';
  } catch {
    return 'en';
  }
}

function readPref(): LanguagePref {
  try {
    const value = getMeta(META_KEY);
    return value === 'ko' || value === 'en' ? value : 'auto';
  } catch {
    return 'auto';
  }
}

const catalogs: Record<Locale, Messages> = { ko, en };

export const useLanguage = create<{
  pref: LanguagePref;
  setPref: (pref: LanguagePref) => void;
}>((set) => ({
  pref: readPref(),
  setPref(pref) {
    try {
      setMeta(META_KEY, pref);
    } catch {
      // 저장하지 못해도 이번 실행에서는 바뀐 언어를 쓴다
    }
    set({ pref });
  },
}));

function messagesFor(pref: LanguagePref): Messages {
  return catalogs[pref === 'auto' ? deviceLocale() : pref];
}

/** 화면에서 쓰는 문구. 언어를 바꾸면 다시 그려진다. */
export function useT(): Messages {
  return messagesFor(useLanguage((s) => s.pref));
}

/** 컴포넌트 밖(이벤트 핸들러 등)에서 지금 언어의 문구가 필요할 때. */
export function currentMessages(): Messages {
  return messagesFor(useLanguage.getState().pref);
}

export type { Messages };
