import { redirect } from "next/navigation";
import { CreditCard, LogIn, ShoppingBag } from "lucide-react";
import { sql } from "drizzle-orm";

import { requireRole } from "@/lib/auth";
import {
  convertBookingToRentingAction,
  createDirectRentingAction,
  recordRentingPaymentAction,
} from "@/app/workflows/actions";
import { AppShell } from "@/components/app/app-shell";
import { FlashMessage } from "@/components/app/flash-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/db";

type SearchParamValue = string | string[] | undefined;

type WorkflowsPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

type PendingBookingRow = {
  bookingId: number;
  customerId: number;
  hotelId: number;
  roomNumber: number;
  startDate: string;
  endDate: string;
};

type ActiveRentingRow = {
  rentingId: number;
  customerId: number;
  hotelId: number;
  roomNumber: number;
  paymentStatus: string;
};

function pickString(value: SearchParamValue): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function readNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export default async function EmployeeWorkflowsPage({ searchParams }: WorkflowsPageProps) {
  // Employee role required (admin can also access for oversight)
  const session = await requireRole("employee", "admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }
  const params = await searchParams;
  const error = pickString(params.error);
  const notice = pickString(params.notice);

  const [pendingBookingsResult, activeRentingsResult] = await Promise.all([
    db.execute(sql`
      SELECT b.booking_id AS "bookingId", b.customer_id AS "customerId", b.hotel_id AS "hotelId",
             b.room_number AS "roomNumber", b.start_date AS "startDate", b.end_date AS "endDate"
      FROM booking b
      ORDER BY b.start_date ASC
      LIMIT 10
    `),
    db.execute(sql`
      SELECT r.renting_id AS "rentingId", r.customer_id AS "customerId", r.hotel_id AS "hotelId",
             r.room_number AS "roomNumber", r.payment_status AS "paymentStatus"
      FROM renting r
      ORDER BY r.start_date DESC
      LIMIT 10
    `),
  ]);

  const pendingBookings: PendingBookingRow[] = pendingBookingsResult.rows.map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      bookingId: readNumber(raw.bookingId),
      customerId: readNumber(raw.customerId),
      hotelId: readNumber(raw.hotelId),
      roomNumber: readNumber(raw.roomNumber),
      startDate: readString(raw.startDate),
      endDate: readString(raw.endDate),
    };
  });

  const activeRentings: ActiveRentingRow[] = activeRentingsResult.rows.map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      rentingId: readNumber(raw.rentingId),
      customerId: readNumber(raw.customerId),
      hotelId: readNumber(raw.hotelId),
      roomNumber: readNumber(raw.roomNumber),
      paymentStatus: readString(raw.paymentStatus),
    };
  });

  return (
    <AppShell pageLabel="Employee Desk" pageTitle="Check-In And Payment Workflows">
      <div className="space-y-5">
        <FlashMessage notice={notice} error={error} />

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LogIn className="size-4" />
                Booking To Renting
              </CardTitle>
              <CardDescription>Convert an existing booking to an active renting at check-in.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={convertBookingToRentingAction} className="space-y-3">
                <input type="hidden" name="returnPath" value="/employee/workflows" />

                <Input type="number" name="bookingId" min={1} required placeholder="Booking ID" />
                <Input type="text" name="employeeSsn" required placeholder="Employee SSN (###-##-####)" />

                <Input type="number" name="paymentAmount" min={0} step="0.01" placeholder="Payment amount (optional)" />
                <Input type="date" name="paymentDate" />

                <Select name="paymentStatus" defaultValue="pending">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>

                <Button type="submit" className="w-full">Convert Booking</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="size-4" />
                Direct Renting (Walk-In)
              </CardTitle>
              <CardDescription>Create a renting directly for a customer without a prior booking.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createDirectRentingAction} className="space-y-3">
                <input type="hidden" name="returnPath" value="/employee/workflows" />

                <Input type="number" name="customerId" min={1} required placeholder="Customer ID" />
                <Input type="number" name="hotelId" min={1} required placeholder="Hotel ID" />
                <Input type="number" name="roomNumber" min={1} required placeholder="Room Number" />
                <Input type="text" name="employeeSsn" required placeholder="Employee SSN (###-##-####)" />
                <Input type="date" name="startDate" required />
                <Input type="date" name="endDate" required />

                <Input type="number" name="paymentAmount" min={0} step="0.01" placeholder="Payment amount (optional)" />
                <Input type="date" name="paymentDate" />

                <Select name="paymentStatus" defaultValue="pending">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>

                <Button type="submit" className="w-full">Create Direct Renting</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-4" />
                Enter Payment
              </CardTitle>
              <CardDescription>Record payment details for an existing renting entry.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={recordRentingPaymentAction} className="space-y-3">
                <input type="hidden" name="returnPath" value="/employee/workflows" />

                <Input type="number" name="rentingId" min={1} required placeholder="Renting ID" />
                <Input type="number" name="paymentAmount" min={0} step="0.01" required placeholder="Payment amount" />
                <Input type="date" name="paymentDate" required />

                <Select name="paymentStatus" defaultValue="paid">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>

                <Button type="submit" className="w-full">Record Payment</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-base">Recent Bookings</CardTitle>
              <CardDescription>Use booking IDs from this list for check-in conversion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {pendingBookings.length === 0 ? (
                <p className="text-muted-foreground">No bookings currently available.</p>
              ) : (
                pendingBookings.map((booking) => (
                  <div key={booking.bookingId} className="rounded-md border border-border/70 bg-muted/35 p-2">
                    <p className="font-medium">Booking #{booking.bookingId}</p>
                    <p className="text-muted-foreground">
                      Customer {booking.customerId} • Hotel {booking.hotelId} • Room {booking.roomNumber}
                    </p>
                    <p className="text-muted-foreground">{booking.startDate} to {booking.endDate}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-base">Recent Rentings</CardTitle>
              <CardDescription>Use renting IDs here for payment entry updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {activeRentings.length === 0 ? (
                <p className="text-muted-foreground">No rentings currently available.</p>
              ) : (
                activeRentings.map((renting) => (
                  <div key={renting.rentingId} className="rounded-md border border-border/70 bg-muted/35 p-2">
                    <p className="font-medium">Renting #{renting.rentingId}</p>
                    <p className="text-muted-foreground">
                      Customer {renting.customerId} • Hotel {renting.hotelId} • Room {renting.roomNumber}
                    </p>
                    <p className="text-muted-foreground">Status: {renting.paymentStatus}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
