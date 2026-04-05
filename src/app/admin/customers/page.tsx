import Link from "next/link";
import { AlertCircle, CircleCheck, Pencil, Plus } from "lucide-react";
import { sql, type SQL } from "drizzle-orm";

import { AppShell } from "@/components/app/app-shell";
import { AdminNav } from "@/components/admin/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createCustomerAction, deleteCustomerAction, updateCustomerAction } from "@/app/admin/actions";
import { db } from "@/db";
import { CUSTOMER_ID_TYPES } from "@/lib/admin-constants";

type SearchParamValue = string | string[] | undefined;

type CustomersPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

type CustomerRow = {
  customerId: number;
  fullName: string;
  address: string;
  idType: string;
  registrationDate: string;
  bookingCount: number;
  rentingCount: number;
};

function pickString(value: SearchParamValue): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function safeDate(value: string): string {
  return value.slice(0, 10);
}

function readNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function buildReturnPath(q: string, sort: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  const query = params.toString();
  return `/admin/customers${query ? `?${query}` : ""}`;
}

export default async function CustomersAdminPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const q = pickString(params.q);
  const sort = pickString(params.sort) || "newest";
  const notice = pickString(params.notice);
  const error = pickString(params.error);

  const orderBy: SQL =
    sort === "name-asc"
      ? sql`c.full_name ASC`
      : sort === "name-desc"
        ? sql`c.full_name DESC`
        : sort === "oldest"
          ? sql`c.customer_id ASC`
          : sql`c.customer_id DESC`;

  const searchPattern = `%${q}%`;

  const result = await db.execute(sql`
    SELECT
      c.customer_id AS "customerId",
      c.full_name AS "fullName",
      c.address AS address,
      c.id_type AS "idType",
      c.registration_date AS "registrationDate",
      COUNT(DISTINCT b.booking_id) AS "bookingCount",
      COUNT(DISTINCT r.renting_id) AS "rentingCount"
    FROM customer c
    LEFT JOIN booking b ON b.customer_id = c.customer_id
    LEFT JOIN renting r ON r.customer_id = c.customer_id
    WHERE ${q ? sql`(c.full_name ILIKE ${searchPattern} OR c.address ILIKE ${searchPattern} OR CAST(c.customer_id AS TEXT) ILIKE ${searchPattern})` : sql`TRUE`}
    GROUP BY c.customer_id, c.full_name, c.address, c.id_type, c.registration_date
    ORDER BY ${orderBy}
    LIMIT 200
  `);

  const rows: CustomerRow[] = result.rows.map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      customerId: readNumber(raw.customerId),
      fullName: readString(raw.fullName),
      address: readString(raw.address),
      idType: readString(raw.idType),
      registrationDate: readString(raw.registrationDate),
      bookingCount: readNumber(raw.bookingCount),
      rentingCount: readNumber(raw.rentingCount),
    };
  });

  const returnPath = buildReturnPath(q, sort);

  return (
    <AppShell pageLabel="Admin CRUD" pageTitle="Customer Management">
      <div className="space-y-5">
        <AdminNav />

        {notice ? (
          <Badge className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
            <CircleCheck className="size-3.5" />
            {notice}
          </Badge>
        ) : null}
        {error ? (
          <Badge variant="destructive" className="gap-1.5">
            <AlertCircle className="size-3.5" />
            {error}
          </Badge>
        ) : null}

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Customers</CardTitle>
              <CardDescription>Insert, update, delete, and search customer records.</CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <form action="/admin/customers" className="flex items-center gap-2">
                <Input name="q" placeholder="Search name, address, ID" defaultValue={q} className="w-56" />
                <input type="hidden" name="sort" value={sort} />
                <Button type="submit" variant="outline">Search</Button>
              </form>

              <Dialog>
                <DialogTrigger render={<Button className="gap-1.5" />}>
                  <Plus className="size-4" />
                  New Customer
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Customer</DialogTitle>
                    <DialogDescription>Add a new customer record to the system.</DialogDescription>
                  </DialogHeader>
                  <form action={createCustomerAction} className="space-y-3">
                    <input type="hidden" name="returnPath" value={returnPath} />
                    <Input name="fullName" required placeholder="Full name" />
                    <Input name="address" required placeholder="Address" />
                    <select name="idType" required className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                      {CUSTOMER_ID_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <Input name="registrationDate" type="date" required />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button type="submit">Create</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Link href={buildReturnPath(q, "newest")} className="text-sm text-muted-foreground hover:text-foreground">Sort newest</Link>
              <Link href={buildReturnPath(q, "oldest")} className="text-sm text-muted-foreground hover:text-foreground">Sort oldest</Link>
              <Link href={buildReturnPath(q, "name-asc")} className="text-sm text-muted-foreground hover:text-foreground">Sort A-Z</Link>
              <Link href={buildReturnPath(q, "name-desc")} className="text-sm text-muted-foreground hover:text-foreground">Sort Z-A</Link>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>ID Type</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.customerId}>
                    <TableCell>{row.customerId}</TableCell>
                    <TableCell>{row.fullName}</TableCell>
                    <TableCell>{row.address}</TableCell>
                    <TableCell>{row.idType}</TableCell>
                    <TableCell>{safeDate(row.registrationDate)}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {row.bookingCount} bookings / {row.rentingCount} rentings
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1" />}>
                            <Pencil className="size-3.5" />
                            Edit
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Edit Customer</DialogTitle>
                              <DialogDescription>Update customer profile fields.</DialogDescription>
                            </DialogHeader>
                            <form action={updateCustomerAction} className="space-y-3">
                              <input type="hidden" name="returnPath" value={returnPath} />
                              <Input name="customerId" readOnly defaultValue={String(row.customerId)} />
                              <Input name="fullName" required defaultValue={row.fullName} />
                              <Input name="address" required defaultValue={row.address} />
                              <select name="idType" required defaultValue={row.idType} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                                {CUSTOMER_ID_TYPES.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                              <Input name="registrationDate" type="date" required defaultValue={safeDate(row.registrationDate)} />
                              <div className="flex justify-end gap-2 pt-1">
                                <Button type="submit">Save Changes</Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <form action={deleteCustomerAction}>
                          <input type="hidden" name="returnPath" value={returnPath} />
                          <input type="hidden" name="customerId" value={row.customerId} />
                          <Button size="sm" variant="destructive">Delete</Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
