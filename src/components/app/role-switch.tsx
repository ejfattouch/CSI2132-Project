"use client";

import { Building2, UserRound } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type UserRole = "customer" | "employee";

type RoleSwitchProps = {
    value: UserRole;
    onValueChange: (role: UserRole) => void;
    className?: string;
};

export function RoleSwitch({ value, onValueChange, className }: RoleSwitchProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Active Role
            </p>
            <ToggleGroup
                value={[value]}
                onValueChange={(next) => {
                    const selected = next[0];
                    if (selected === "customer" || selected === "employee") {
                        onValueChange(selected);
                    }
                }}
                className="rounded-lg border border-border/80 bg-background p-1"
            >
                <ToggleGroupItem
                    value="customer"
                    className="gap-2 rounded-md px-3 py-2 text-xs font-medium md:text-sm"
                    aria-label="Switch to customer"
                >
                    <UserRound className="size-4" />
                    Customer
                </ToggleGroupItem>
                <ToggleGroupItem
                    value="employee"
                    className="gap-2 rounded-md px-3 py-2 text-xs font-medium md:text-sm"
                    aria-label="Switch to employee"
                >
                    <Building2 className="size-4" />
                    Employee
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
}
