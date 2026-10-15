"use client";

import { useState } from "react";

const HEX = /^#[0-9a-f]{6}$/i;

export function useColorField(initial: string | null) {
  const [value, setValue] = useState(
    initial && HEX.test(initial) ? initial.toLowerCase() : "",
  );
  return {
    value,
    set: (v: string) => setValue(v.toLowerCase()),
    clear: () => setValue(""),
  };
}
