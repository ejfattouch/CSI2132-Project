"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const adminLinks = [
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/employees", label: "Employees" },
    { href: "/admin/hotels", label: "Hotels" },
    { href: "/admin/rooms", label: "Rooms" },
] as const;

export function AdminNav() {
    const pathname = usePathname();

    return (
        <div className="flex flex-wrap gap-2">
            {adminLinks.map((link) => (
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
