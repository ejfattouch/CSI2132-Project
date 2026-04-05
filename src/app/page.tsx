import { ArrowRight, CalendarDays, CircleDollarSign, Hotel, Sparkles } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const kpiCards = [
  {
    label: "Hotels Available",
    value: "40",
    detail: "Across 5 chains",
    icon: Hotel,
  },
  {
    label: "Rooms Indexed",
    value: "220+",
    detail: "Search-ready inventory",
    icon: CalendarDays,
  },
  {
    label: "Active Customers",
    value: "30",
    detail: "Seeded user profiles",
    icon: CircleDollarSign,
  },
];

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-5 sm:space-y-6 motion-reveal">
        <section className="surface-strong overflow-hidden rounded-3xl">
          <div className="grid gap-4 p-4 sm:gap-5 sm:p-6 md:grid-cols-[2fr_1fr] md:p-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit gap-2 rounded-full border border-border/70 bg-[color:var(--accent-soft)] px-3 py-1 text-strong">
                <Sparkles className="size-3.5" />
                Phase 1 Foundation Complete
              </Badge>
              <h1 className="max-w-2xl font-heading text-2xl leading-tight font-semibold text-strong sm:text-3xl md:text-4xl">
                Launch-ready interface for hotel discovery and operations.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                This dashboard is the baseline for upcoming customer search workflows and employee booking management.
                Browse, booking, check-in conversion, and payment workflows are now available.
              </p>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                <Link
                  href="/browse-hotels"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-transparent bg-primary px-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0"
                >
                  Browse Hotels
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/employee/workflows"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-[color:var(--surface-1)] px-3 text-sm font-medium text-strong transition-all duration-150 hover:-translate-y-0.5 hover:bg-[color:var(--accent-soft)] active:translate-y-0"
                >
                  Employee Workflows
                </Link>
              </div>
            </div>
            <Card className="border border-border/70 bg-[color:var(--surface-2)]/85 shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle className="text-strong">Readiness Snapshot</CardTitle>
                <CardDescription>Current implementation status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-md border border-border/70 bg-[color:var(--surface-1)] px-3 py-2">
                  <span>Database schema</span>
                  <Badge>Ready</Badge>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/70 bg-[color:var(--surface-1)] px-3 py-2">
                  <span>Archive triggers</span>
                  <Badge>Ready</Badge>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/70 bg-[color:var(--surface-1)] px-3 py-2">
                  <span>Workflow forms</span>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="stagger-list grid gap-4 md:grid-cols-3">
          {kpiCards.map((card) => (
            <Card key={card.label} className="surface-panel border-border/70 bg-card/90">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardDescription className="text-muted-foreground">{card.label}</CardDescription>
                  <CardTitle className="mt-2 text-3xl text-strong">{card.value}</CardTitle>
                </div>
                <div className="rounded-lg border border-border/70 bg-[color:var(--accent-soft)]/70 p-2">
                  <card.icon className="size-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.detail}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="surface-panel border-border/70">
            <CardHeader>
              <CardTitle className="text-strong">Phase 2 Preview</CardTitle>
              <CardDescription>Planned implementation sequence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md border border-border/70 bg-[color:var(--surface-2)]/70 p-3">
                1. Room search filters + availability query wiring.
              </div>
              <div className="rounded-md border border-border/70 bg-[color:var(--surface-2)]/70 p-3">
                2. Customer booking flow with conflict validation.
              </div>
              <div className="rounded-md border border-border/70 bg-[color:var(--surface-2)]/70 p-3">
                3. Employee renting conversion from existing bookings.
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel border-border/70">
            <CardHeader>
              <CardTitle className="text-strong">Guardrails For This Phase</CardTitle>
              <CardDescription>Intentional non-goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="rounded-md border border-border/70 bg-[color:var(--surface-2)]/70 p-3">
                Full CRUD modules now available for customers, employees, hotels, and rooms.
              </p>
              <p className="rounded-md border border-border/70 bg-[color:var(--surface-2)]/70 p-3">
                No authentication or authorization layer yet.
              </p>
              <p className="rounded-md border border-border/70 bg-[color:var(--surface-2)]/70 p-3">
                SQL view browsing pages are still deferred.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
