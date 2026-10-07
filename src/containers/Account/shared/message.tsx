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
        "border px-4 py-3 text-sm",
        state.status === "error"
          ? "border-zs-coral/40 bg-zs-coral/10 text-zs-coral"
          : "border-zs-lime/40 bg-zs-lime/10 text-zs-lime",
      )}
    >
      {state.message}
    </p>
  );
}
