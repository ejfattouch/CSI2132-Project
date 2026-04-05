"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const reportLinks = [
    { href: "/reports/rooms-per-area", label: "Rooms per Area" },
    { href: "/reports/hotel-capacity", label: "Hotel Capacity" },
] as const;

export function ReportsNav() {
    const pathname = usePathname();

    return (
        <div className="flex flex-wrap gap-2">
            {reportLinks.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        "rounded-md border px-3 py-1.5 text-sm font-medium transition",
                        pathname === link.href
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    {link.label}
                </Link>
            ))}
        </div>
    );
}
