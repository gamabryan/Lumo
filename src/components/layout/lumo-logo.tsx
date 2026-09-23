import Link from "next/link";

export function LumoLogo({
  href = "/dashboard",
  size = "default",
}: {
  href?: string;
  size?: "default" | "lg";
}) {
  const mark = size === "lg" ? "size-10 text-sm" : "size-8 text-xs";
  const word = size === "lg" ? "text-2xl" : "text-base";

  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-xl px-1 py-1 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className={`flex items-center justify-center rounded-xl bg-[linear-gradient(145deg,oklch(0.55_0.12_195),oklch(0.4_0.08_210))] font-heading font-bold tracking-tight text-white shadow-[0_1px_0_oklch(1_0_0/0.25)_inset] transition-transform duration-200 group-hover:scale-[1.04] ${mark}`}
      >
        L
      </span>
      <span
        className={`font-heading font-semibold tracking-tight text-foreground ${word}`}
      >
        Lumo
      </span>
    </Link>
  );
}
