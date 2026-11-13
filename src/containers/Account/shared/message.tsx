import { cn } from "@/utils/cn";

export function Message({
  state,
}: {
  state: {
    status: "idle" | "error" | "success" | "duplicate";
    message?: string;
  };
}) {
  if (!state.message || state.status === "idle" || state.status === "duplicate")
    return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "border p-3 rounded-sm text-sm",
        state.status === "error"
          ? "border-zs-coral/40 bg-zs-coral/10 text-zs-coral"
          : "border-accent-gold/40 bg-accent-gold/10 text-accent-gold",
      )}
    >
      {state.message}
    </p>
  );
}
