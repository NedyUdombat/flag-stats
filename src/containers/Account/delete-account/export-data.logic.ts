"use client";

import { useState, useTransition } from "react";
import { exportMyDataAction } from "@/features/account/actions/export.actions";
import type { SettingsActionState } from "@/features/account/actions/types";

function download(filename: string, json: string) {
  const url = URL.createObjectURL(
    new Blob([json], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useExportData() {
  const [pending, start] = useTransition();
  const [state, setState] = useState<SettingsActionState>({ status: "idle" });

  const run = () =>
    start(async () => {
      const res = await exportMyDataAction();
      if (res.status === "success" && res.json && res.filename)
        download(res.filename, res.json);
      setState({ status: res.status, message: res.message });
    });

  return { pending, state, run };
}
