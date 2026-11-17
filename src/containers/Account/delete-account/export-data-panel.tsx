"use client";

import { DownloadIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { Message } from "../shared/message";
import { Panel } from "../shared/panel";
import { buttonSecondary } from "../styles";
import { useExportData } from "./export-data.logic";

export function ExportDataPanel() {
  const { pending, state, run } = useExportData();
  return (
    <Panel
      title="Download my data"
      description="A copy of your account details, roles and athlete profile as a JSON file. You may want this before deleting."
    >
      <div className="space-y-3">
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className={cn(
            buttonSecondary,
            "cursor-pointer inline-flex justify-center font-sans text-[14px] capitalize font-normal rounded-sm",
          )}
        >
          <DownloadIcon className="size-4" aria-hidden />
          {pending ? "Preparing…" : "Download my data"}
        </button>
        <Message state={state} />
      </div>
    </Panel>
  );
}
