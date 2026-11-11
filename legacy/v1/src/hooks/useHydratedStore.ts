"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/appStore";

export function useHydratedStore() {
  const hydrate = useAppStore((state) => state.hydrate);
  const hydrated = useAppStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return hydrated;
}
