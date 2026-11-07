"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { type Lang } from "@/lib/i18n";
import { patientAuthStorage, type PatientSession } from "@/lib/patient-api";

interface PatientContextValue {
  session: PatientSession | null;
  lang: Lang;
  setLang: (l: Lang) => void;
}

const PatientContext = createContext<PatientContextValue>({
  session: null,
  lang: "en",
  setLang: () => {},
});

export function usePatient() {
  return useContext(PatientContext);
}

export function PatientProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PatientSession | null>(null);
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const s = patientAuthStorage.getPatient();
    if (s) {
      setSession(s);
      setLangState((s.preferred_language as Lang) || "en");
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (session) {
      patientAuthStorage.setPatient({ ...session, preferred_language: l });
    }
  };

  return (
    <PatientContext.Provider value={{ session, lang, setLang }}>
      {children}
    </PatientContext.Provider>
  );
}
