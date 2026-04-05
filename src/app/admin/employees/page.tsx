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
import { createEmployeeAction, deleteEmployeeAction, updateEmployeeAction } from "@/app/admin/actions";
import { db } from "@/db";

type SearchParamValue = string | string[] | undefined;

type EmployeesPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

type EmployeeRow = {
  ssn: string;
  fullName: string;
  role: string;
  address: string;
  hotelId: number;
  hotelAddress: string;
};

type HotelOption = {
  hotelId: number;
  address: string;
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

function buildReturnPath(q: string, sort: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  const query = params.toString();
  return `/admin/employees${query ? `?${query}` : ""}`;
}

export default async function EmployeesAdminPage({ searchParams }: EmployeesPageProps) {
  const params = await searchParams;
  const q = pickString(params.q);
  const sort = pickString(params.sort) || "name-asc";
  const notice = pickString(params.notice);
  const error = pickString(params.error);

  const orderBy: SQL =
    sort === "name-desc"
      ? sql`e.full_name DESC`
      : sort === "role"
        ? sql`e.role ASC, e.full_name ASC`
        : sort === "hotel"
          ? sql`e.hotel_id ASC, e.full_name ASC`
          : sql`e.full_name ASC`;

  const searchPattern = `%${q}%`;

  const [employeesResult, hotelsResult] = await Promise.all([
    db.execute(sql`
      SELECT
        e.ssn AS ssn,
        e.full_name AS "fullName",
        e.role AS role,
        e.address AS address,
        e.hotel_id AS "hotelId",
        h.address AS "hotelAddress"
      FROM employee e
      INNER JOIN hotel h ON h.hotel_id = e.hotel_id
      WHERE ${q ? sql`(e.full_name ILIKE ${searchPattern} OR e.role ILIKE ${searchPattern} OR e.ssn ILIKE ${searchPattern})` : sql`TRUE`}
      ORDER BY ${orderBy}
      LIMIT 200
    `),
    db.execute(sql`
      SELECT h.hotel_id AS "hotelId", h.address AS address
      FROM hotel h
      ORDER BY h.hotel_id ASC
    `),
  ]);

  const rows: EmployeeRow[] = employeesResult.rows.map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      ssn: readString(raw.ssn),
      fullName: readString(raw.fullName),
      role: readString(raw.role),
      address: readString(raw.address),
      hotelId: readNumber(raw.hotelId),
      hotelAddress: readString(raw.hotelAddress),
    };
  });

  const hotelOptions: HotelOption[] = hotelsResult.rows.map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      hotelId: readNumber(raw.hotelId),
      address: readString(raw.address),
    };
  });

  const returnPath = buildReturnPath(q, sort);

  return (
    <AppShell pageLabel="Admin CRUD" pageTitle="Employee Management">
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
              <CardTitle>Employees</CardTitle>
              <CardDescription>Manage employee records and hotel assignments.</CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <form action="/admin/employees" className="flex items-center gap-2">
                <Input name="q" placeholder="Search name, role, SSN" defaultValue={q} className="w-56" />
                <input type="hidden" name="sort" value={sort} />
                <Button type="submit" variant="outline">Search</Button>
              </form>

              <Dialog>
                <DialogTrigger render={<Button className="gap-1.5" />}>
                  <Plus className="size-4" />
                  New Employee
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Employee</DialogTitle>
                    <DialogDescription>Add a new employee record.</DialogDescription>
                  </DialogHeader>
                  <form action={createEmployeeAction} className="space-y-3">
                    <input type="hidden" name="returnPath" value={returnPath} />
                    <Input name="ssn" required placeholder="SSN (###-##-####)" />
                    <select name="hotelId" required className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                      {hotelOptions.map((hotel) => (
                        <option key={hotel.hotelId} value={hotel.hotelId}>
                          Hotel {hotel.hotelId} - {hotel.address}
                        </option>
                      ))}
                    </select>
                    <Input name="fullName" required placeholder="Full name" />
                    <Input name="address" required placeholder="Address" />
                    <Input name="role" required placeholder="Role" />
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
              <Link href={buildReturnPath(q, "name-asc")} className="text-sm text-muted-foreground hover:text-foreground">Sort A-Z</Link>
              <Link href={buildReturnPath(q, "name-desc")} className="text-sm text-muted-foreground hover:text-foreground">Sort Z-A</Link>
              <Link href={buildReturnPath(q, "role")} className="text-sm text-muted-foreground hover:text-foreground">Sort by role</Link>
              <Link href={buildReturnPath(q, "hotel")} className="text-sm text-muted-foreground hover:text-foreground">Sort by hotel</Link>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SSN</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.ssn}>
                    <TableCell>{row.ssn}</TableCell>
                    <TableCell>{row.fullName}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>
                      {row.hotelId} - <span className="text-muted-foreground">{row.hotelAddress}</span>
                    </TableCell>
                    <TableCell>{row.address}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1" />}>
                            <Pencil className="size-3.5" />
                            Edit
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Edit Employee</DialogTitle>
                              <DialogDescription>Update hotel assignment or profile fields.</DialogDescription>
                            </DialogHeader>
                            <form action={updateEmployeeAction} className="space-y-3">
                              <input type="hidden" name="returnPath" value={returnPath} />
                              <Input name="ssn" required defaultValue={row.ssn} />
                              <select name="hotelId" required defaultValue={String(row.hotelId)} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                                {hotelOptions.map((hotel) => (
                                  <option key={hotel.hotelId} value={hotel.hotelId}>
                                    Hotel {hotel.hotelId} - {hotel.address}
                                  </option>
                                ))}
                              </select>
                              <Input name="fullName" required defaultValue={row.fullName} />
                              <Input name="address" required defaultValue={row.address} />
                              <Input name="role" required defaultValue={row.role} />
                              <div className="flex justify-end gap-2 pt-1">
                                <Button type="submit">Save Changes</Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <form action={deleteEmployeeAction}>
                          <input type="hidden" name="returnPath" value={returnPath} />
                          <input type="hidden" name="ssn" value={row.ssn} />
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
