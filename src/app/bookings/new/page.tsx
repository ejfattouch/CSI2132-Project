import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarClock, Hotel, UserRound } from "lucide-react";

import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";
import { FlashMessage } from "@/components/app/flash-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBookingAction } from "@/app/workflows/actions";

type SearchParamValue = string | string[] | undefined;

type BookingPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

function pickString(value: SearchParamValue): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function pickPositiveInt(value: SearchParamValue, fallback = ""): string {
  const parsed = Number(pickString(value));
  return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : fallback;
}

function pickDate(value: SearchParamValue): string {
  const raw = pickString(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function buildBrowsePath(params: Record<string, SearchParamValue>): string {
  const query = new URLSearchParams();
  const allowedKeys = [
    "startDate",
    "endDate",
    "roomCapacity",
    "area",
    "hotelChain",
    "hotelCategory",
    "minTotalRooms",
    "minPrice",
    "maxPrice",
  ] as const;

  for (const key of allowedKeys) {
    const value = pickString(params[key]);
    if (value) {
      query.set(key, value);
    }
  }

  return `/browse-hotels${query.toString() ? `?${query.toString()}` : ""}`;
}

export default async function NewBookingPage({ searchParams }: BookingPageProps) {
  // Customer and admin roles can access booking creation
  const session = await requireRole("customer", "admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }
  const params = await searchParams;

  const hotelId = pickPositiveInt(params.hotelId);
  const roomNumber = pickPositiveInt(params.roomNumber);
  const startDate = pickDate(params.startDate);
  const endDate = pickDate(params.endDate);

  const area = pickString(params.area);
  const chainName = pickString(params.chainName);

  const error = pickString(params.error);
  const notice = pickString(params.notice);

  const returnPath = `/bookings/new?${new URLSearchParams({
    hotelId,
    roomNumber,
    startDate,
    endDate,
    area,
    chainName,
  }).toString()}`;

  const successPath = pickString(params.returnBrowse) || buildBrowsePath(params);

  return (
    <AppShell pageLabel="Customer Booking Flow" pageTitle="Create Booking">
      <div className="mx-auto space-y-5 max-w-5xl">
        <FlashMessage notice={notice} error={error} />

        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-5" />
                Confirm Booking Details
              </CardTitle>
              <CardDescription>
                This form creates a booking record for a selected available room.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createBookingAction} className="space-y-4">
                <input type="hidden" name="returnPath" value={returnPath} />
                <input type="hidden" name="successPath" value={successPath} />

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1.5 text-sm">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Customer ID</span>
                    <Input name="customerId" type="number" min={1} required placeholder="Ex: 12" />
                  </label>

                  <label className="space-y-1.5 text-sm">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Hotel ID</span>
                    <Input name="hotelId" type="number" min={1} required defaultValue={hotelId} />
                  </label>

                  <label className="space-y-1.5 text-sm">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Room Number</span>
                    <Input name="roomNumber" type="number" min={1} required defaultValue={roomNumber} />
                  </label>

                  <label className="space-y-1.5 text-sm">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Start Date</span>
                    <Input name="startDate" type="date" required defaultValue={startDate} />
                  </label>

                  <label className="space-y-1.5 text-sm md:col-span-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">End Date</span>
                    <Input name="endDate" type="date" required defaultValue={endDate} />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border/70 pt-3">
                  <Button type="submit">Create Booking</Button>
                  <Link
                    href={successPath}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-all duration-150 hover:-translate-y-0.5 hover:bg-[color:var(--surface-2)] active:translate-y-0 dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
                  >
                    Back To Browse Hotels
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hotel className="size-4" />
                  Selected Room Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Hotel ID: <span className="font-medium">{hotelId || "Not set"}</span></p>
                <p>Room Number: <span className="font-medium">{roomNumber || "Not set"}</span></p>
                <p>Area: <span className="font-medium">{area || "Not set"}</span></p>
                <p>Chain: <span className="font-medium">{chainName || "Not set"}</span></p>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="size-4" />
                  Booking Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Submit to create a validated booking. Overlap and reference rules are enforced server-side.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
