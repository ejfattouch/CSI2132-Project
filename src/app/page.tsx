import { redirect } from "next/navigation";
import { AlertCircle, ArrowRight, BarChart3, CalendarCheck2, CalendarDays, Hotel, Settings, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

import { requireAuth } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Role = "customer" | "employee" | "admin";

type QuickAction = {
  label: string;
  href: string;
  description: string;
  icon: typeof Hotel;
};

const quickActionsByRole: Record<Role, QuickAction[]> = {
  customer: [
    {
      label: "Browse Hotels",
      href: "/browse-hotels",
      description: "Find available rooms by date, area, and price.",
      icon: Hotel,
    },
    {
      label: "Create Booking",
      href: "/bookings/new",
      description: "Book a room directly with validated date checks.",
      icon: CalendarDays,
    },
    {
      label: "View Reports",
      href: "/reports/rooms-per-area",
      description: "See availability and capacity dashboards.",
      icon: BarChart3,
    },
  ],
  employee: [
    {
      label: "Employee Workflows",
      href: "/employee/workflows",
      description: "Convert bookings, create rentings, and record payments.",
      icon: CalendarCheck2,
    },
    {
      label: "Rooms Per Area",
      href: "/reports/rooms-per-area",
      description: "Monitor live availability by location.",
      icon: BarChart3,
    },
    {
      label: "Hotel Capacity",
      href: "/reports/hotel-capacity",
      description: "Review room distribution and guest capacity.",
      icon: ShieldCheck,
    },
  ],
  admin: [
    {
      label: "Manage Customers",
      href: "/admin/customers",
      description: "Create, edit, and remove customer records.",
      icon: Users,
    },
    {
      label: "Manage Employees",
      href: "/admin/employees",
      description: "Maintain staff assignments and profiles.",
      icon: Settings,
    },
    {
      label: "Browse Hotels",
      href: "/browse-hotels",
      description: "Access customer browsing and booking paths.",
      icon: Hotel,
    },
    {
      label: "Employee Workflows",
      href: "/employee/workflows",
      description: "Access check-in and payment operations.",
      icon: CalendarCheck2,
    },
    {
      label: "Rooms Per Area",
      href: "/reports/rooms-per-area",
      description: "View operational availability insights.",
      icon: BarChart3,
    },
    {
      label: "Hotel Capacity",
      href: "/reports/hotel-capacity",
      description: "Review capacity utilization across hotels.",
      icon: ShieldCheck,
    },
  ],
};

const roleSummary: Record<Role, { title: string; subtitle: string; tag: string }> = {
  customer: {
    title: "Customer Workspace",
    subtitle: "Search rooms, create bookings, and track availability reports.",
    tag: "Customer Access",
  },
  employee: {
    title: "Employee Workspace",
    subtitle: "Handle check-ins, direct rentings, and payment updates efficiently.",
    tag: "Employee Access",
  },
  admin: {
    title: "Administrator Workspace",
    subtitle: "Full platform access across customer, employee, admin, and reporting features.",
    tag: "Admin Access",
  },
};

type HomePageProps = {
  searchParams: Promise<Record<string, string>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  // Require authentication for all roles
  const session = await requireAuth();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const params = await searchParams;
  const isUnauthorized = params.unauthorized === "true";
  const role = session.role as Role;
  const roleContent = roleSummary[role];
  const quickActions = quickActionsByRole[role];

  return (
    <AppShell>
      <div className="space-y-5 sm:space-y-6 motion-reveal">
        {isUnauthorized && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm text-destructive">Access Denied</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You do not have permission to access the requested page. Only your authorized role-specific features are available.
              </p>
            </div>
          </div>
        )}

        <section className="surface-strong overflow-hidden rounded-3xl">
          <div className="grid gap-4 p-4 sm:gap-5 sm:p-6 md:grid-cols-[2fr_1fr] md:p-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit gap-2 rounded-full border border-border/70 bg-[color:var(--accent-soft)] px-3 py-1 text-strong">
                <ShieldCheck className="size-3.5" />
                {roleContent.tag}
              </Badge>
              <h1 className="max-w-2xl font-heading text-2xl leading-tight font-semibold text-strong sm:text-3xl md:text-4xl">
                {roleContent.title}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {roleContent.subtitle}
              </p>
            </div>
            <Card className="border border-border/70 bg-[color:var(--surface-2)]/85 shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle className="text-strong">Current Session</CardTitle>
                <CardDescription>Authenticated access context</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-md border border-border/70 bg-[color:var(--surface-1)] px-3 py-2">
                  <span>Signed in as</span>
                  <Badge className="capitalize">{session.role}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/70 bg-[color:var(--surface-1)] px-3 py-2">
                  <span>Account</span>
                  <span className="truncate max-w-[180px] text-right text-muted-foreground">{session.email}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/70 bg-[color:var(--surface-1)] px-3 py-2">
                  <span>Authorization</span>
                  <Badge variant="outline">Enforced</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className={`stagger-list grid gap-4 ${role === "admin" ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-3"}`}>
          {quickActions.map((action) => (
            <Card key={action.label} className="surface-panel border-border/70 bg-card/90">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardDescription className="text-muted-foreground">Quick Action</CardDescription>
                  <CardTitle className="mt-2 text-xl text-strong">{action.label}</CardTitle>
                </div>
                <div className="rounded-lg border border-border/70 bg-[color:var(--accent-soft)]/70 p-2">
                  <action.icon className="size-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{action.description}</p>
                <Link
                  href={action.href}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-[color:var(--surface-1)] px-3 text-sm font-medium text-strong transition-all duration-150 hover:-translate-y-0.5 hover:bg-[color:var(--accent-soft)] active:translate-y-0"
                >
                  Open
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
