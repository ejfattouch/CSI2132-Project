"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ComponentType, type ReactNode, useState, useEffect } from "react";
import {
    Bell,
    Building2,
    CalendarCheck2,
    Hotel,
    LayoutDashboard,
    LifeBuoy,
    Menu,
    Search,
    User,
    BarChart3,
    LogOut,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type SessionData = {
    userId: number;
    email: string;
    role: "customer" | "employee" | "admin";
    customerId?: number;
    employeeSsn?: string;
};

type AppShellProps = {
    children: ReactNode;
    pageLabel?: string;
    pageTitle?: string;
};

type NavItem = {
    label: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Browse Hotels", href: "/browse-hotels", icon: Search },
    { label: "Reservations", href: "/employee/workflows", icon: CalendarCheck2 },
    { label: "Admin", href: "/admin/customers", icon: User },
    { label: "Reports", href: "/reports/rooms-per-area", icon: BarChart3 },
    { label: "Support", href: "#", icon: LifeBuoy },
];

function MainNav({ compact = false }: { compact?: boolean }) {
    const pathname = usePathname();

    return (
        <nav className="space-y-1">
            {navItems.map((item) => (
                <Link
                    key={item.label}
                    href={item.href}
                    aria-disabled={item.href === "#"}
                    className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        pathname === item.href
                            ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                            : "text-muted-foreground hover:bg-[color:var(--accent-soft)] hover:text-foreground",
                        item.href === "#" && "pointer-events-none opacity-50",
                        compact && "text-base"
                    )}
                >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                </Link>
            ))}
        </nav>
    );
}

export function AppShell({
    children,
    pageLabel = "Dashboard",
    pageTitle = "Welcome to e-Hotels Web Console",
}: AppShellProps) {
    const router = useRouter();
    const [session, setSession] = useState<SessionData | null>(null);

    useEffect(() => {
        async function loadSession() {
            try {
                const response = await fetch("/api/auth/session");
                if (response.ok) {
                    const data = await response.json();
                    setSession(data);
                } else {
                    setSession(null);
                }
            } catch (error) {
                console.error("Failed to load session:", error);
                setSession(null);
            }
        }

        loadSession();
    }, []);

    async function handleSignOut() {
        try {
            await fetch("/api/auth/sign-out", { method: "POST" });
            router.push("/auth/sign-in");
            router.refresh();
        } catch (error) {
            console.error("Sign-out failed:", error);
        }
    }

    const userInitials = session?.email.substring(0, 2).toUpperCase() || "EH";
    const roleColor = {
        customer: "role-accent-customer",
        employee: "role-accent-employee",
        admin: "role-accent-admin",
    }[session?.role || "customer"];

    return (
        <div className="app-frame min-h-screen">
            <div className="mx-auto flex min-h-screen w-full max-w-[1400px] bg-background/80 backdrop-blur-sm lg:border-x lg:border-border/40">
                <aside className="surface-panel hidden w-72 shrink-0 rounded-r-3xl border-r border-border/70 bg-card/90 lg:flex lg:flex-col motion-reveal">
                    <div className="space-y-6 p-6">
                        <div className="space-y-2">
                            <Badge variant="secondary" className="gap-2 px-3 py-1 text-xs tracking-wide">
                                <Hotel className="size-3.5" />
                                e-Hotels
                            </Badge>
                            <h1 className="font-heading text-2xl font-semibold text-strong">Operations Console</h1>
                            <p className="text-sm text-muted-foreground">
                                {session ? `Logged in as ${session.role}` : "Loading..."}
                            </p>
                        </div>
                        {session && (
                            <div className="rounded-xl border border-border/70 bg-[color:var(--surface-2)]/90 p-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Current User:</p>
                                <p className="text-sm font-medium truncate text-strong">{session.email}</p>
                                <Badge className={`mt-2 border capitalize ${roleColor}`}>
                                    {session.role}
                                </Badge>
                            </div>
                        )}
                    </div>
                    <Separator />
                    <div className="flex-1 p-4">
                        <MainNav />
                    </div>
                </aside>

                <div className="flex min-h-screen flex-1 flex-col">
                    <header className="sticky top-0 z-30 border-b border-border/70 bg-[color:var(--surface-1)]/90 backdrop-blur motion-reveal">
                        <div className="flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 md:px-6">
                            <Sheet>
                                <SheetTrigger
                                    render={
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="lg:hidden"
                                            aria-label="Open navigation menu"
                                        />
                                    }
                                >
                                    <Menu className="size-4" />
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[85vw] p-0 sm:max-w-sm">
                                    <SheetHeader className="space-y-1 border-b border-border/70 p-6">
                                        <SheetTitle className="text-xl">e-Hotels</SheetTitle>
                                        <SheetDescription>
                                            {session ? `Logged in as ${session.role}` : "Loading..."}
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="space-y-6 p-6">
                                        {session && (
                                            <div className="rounded-lg border border-border/70 bg-[color:var(--surface-2)]/90 p-3">
                                                <p className="text-xs font-medium text-muted-foreground mb-1">Current User:</p>
                                                <p className="text-sm font-medium truncate text-strong">{session.email}</p>
                                                <Badge className={`mt-2 border capitalize ${roleColor}`}>
                                                    {session.role}
                                                </Badge>
                                            </div>
                                        )}
                                        <MainNav compact />
                                    </div>
                                </SheetContent>
                            </Sheet>

                            <div className="min-w-0 flex-1">
                                <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-[0.2em]">{pageLabel}</p>
                                <h2 className="truncate font-heading text-base font-semibold text-strong sm:text-lg">{pageTitle}</h2>
                            </div>

                            {session && (
                                <Badge className={`hidden rounded-full border px-3 py-1 text-xs sm:inline-flex capitalize ${roleColor}`}>
                                    {session.role}
                                </Badge>
                            )}

                            <Button variant="outline" size="icon" className="relative border-border/80 bg-[color:var(--surface-2)]" aria-label="Notifications">
                                <Bell className="size-4" />
                                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-500" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <Button variant="ghost" className="h-10 rounded-full px-1.5" aria-label="Open profile menu" />
                                    }
                                >
                                    <Avatar className="size-8 ring-1 ring-border">
                                        <AvatarFallback className="bg-muted text-xs font-semibold">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 surface-panel">
                                    <DropdownMenuLabel>e-Hotels Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {session ? (
                                        <>
                                            <DropdownMenuItem disabled>
                                                <User className="mr-2 size-4" />
                                                {session.email}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem disabled>
                                                <Building2 className="mr-2 size-4" />
                                                Role: {session.role}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={handleSignOut}>
                                                <LogOut className="mr-2 size-4" />
                                                Sign Out
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    <main className="flex-1 px-3 py-5 sm:px-4 sm:py-6 md:px-6 md:py-8">{children}</main>
                </div>
            </div>
        </div>
    );
}
