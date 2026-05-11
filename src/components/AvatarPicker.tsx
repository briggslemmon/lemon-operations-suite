import { AVATARS } from "@/lib/role";

export function AvatarPicker({
  value,
  onChange,
  size = "md",
}: {
  value: string;
  onChange: (a: string) => void;
  size?: "sm" | "md";
}) {
  const cell = size === "sm" ? "size-9 text-lg" : "size-12 text-2xl";
  return (
    <div className="grid grid-cols-6 gap-2">
      {AVATARS.map((a) => {
        const active = a === value;
        return (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            className={`${cell} rounded-xl grid place-items-center transition border ${
              active
                ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 ring-2 ring-[color:var(--gold)]/30"
                : "border-border bg-secondary/50 hover:border-[color:var(--gold)]/40"
            }`}
            aria-label={`Avatar ${a}`}
          >
            {a}
          </button>
        );
      })}
    </div>
  );
}
