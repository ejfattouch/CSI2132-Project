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
import { createRoomAction, deleteRoomAction, updateRoomAction } from "@/app/admin/actions";
import { db } from "@/db";
import { ROOM_CAPACITIES, ROOM_VIEWS } from "@/lib/admin-constants";

type SearchParamValue = string | string[] | undefined;

type RoomsPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

type RoomRow = {
  hotelId: number;
  hotelAddress: string;
  roomNumber: number;
  price: number;
  capacity: string;
  viewType: string;
  extendible: boolean;
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

function readBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function buildReturnPath(q: string, sort: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  const query = params.toString();
  return `/admin/rooms${query ? `?${query}` : ""}`;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);
}

export default async function RoomsAdminPage({ searchParams }: RoomsPageProps) {
  const params = await searchParams;
  const q = pickString(params.q);
  const sort = pickString(params.sort) || "price-asc";
  const notice = pickString(params.notice);
  const error = pickString(params.error);

  const orderBy: SQL =
    sort === "price-desc"
      ? sql`CAST(r.price AS DOUBLE PRECISION) DESC`
      : sort === "hotel"
        ? sql`r.hotel_id ASC, r.room_number ASC`
        : sort === "capacity"
          ? sql`r.capacity ASC, r.hotel_id ASC`
          : sql`CAST(r.price AS DOUBLE PRECISION) ASC`;

  const searchPattern = `%${q}%`;

  const [roomsResult, hotelsResult] = await Promise.all([
    db.execute(sql`
      SELECT
        r.hotel_id AS "hotelId",
        h.address AS "hotelAddress",
        r.room_number AS "roomNumber",
        CAST(r.price AS DOUBLE PRECISION) AS price,
        r.capacity AS capacity,
        COALESCE(r.view_type, '') AS "viewType",
        r.extendible AS extendible
      FROM room r
      INNER JOIN hotel h ON h.hotel_id = r.hotel_id
      WHERE ${q ? sql`(CAST(r.hotel_id AS TEXT) ILIKE ${searchPattern} OR CAST(r.room_number AS TEXT) ILIKE ${searchPattern} OR r.capacity ILIKE ${searchPattern} OR h.address ILIKE ${searchPattern})` : sql`TRUE`}
      ORDER BY ${orderBy}
      LIMIT 250
    `),
    db.execute(sql`
      SELECT h.hotel_id AS "hotelId", h.address AS address
      FROM hotel h
      ORDER BY h.hotel_id ASC
    `),
  ]);

  const rows: RoomRow[] = roomsResult.rows.map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      hotelId: readNumber(raw.hotelId),
      hotelAddress: readString(raw.hotelAddress),
      roomNumber: readNumber(raw.roomNumber),
      price: readNumber(raw.price),
      capacity: readString(raw.capacity),
      viewType: readString(raw.viewType),
      extendible: readBoolean(raw.extendible),
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
    <AppShell pageLabel="Admin CRUD" pageTitle="Room Management">
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
              <CardTitle>Rooms</CardTitle>
              <CardDescription>Manage room inventory by hotel with strict capacity/view constraints.</CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <form action="/admin/rooms" className="flex items-center gap-2">
                <Input name="q" placeholder="Search hotel, room, capacity" defaultValue={q} className="w-56" />
                <input type="hidden" name="sort" value={sort} />
                <Button type="submit" variant="outline">Search</Button>
              </form>

              <Dialog>
                <DialogTrigger render={<Button className="gap-1.5" />}>
                  <Plus className="size-4" />
                  New Room
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Room</DialogTitle>
                    <DialogDescription>Add room inventory to an existing hotel.</DialogDescription>
                  </DialogHeader>
                  <form action={createRoomAction} className="space-y-3">
                    <input type="hidden" name="returnPath" value={returnPath} />
                    <select name="hotelId" required className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                      {hotelOptions.map((hotel) => (
                        <option key={hotel.hotelId} value={hotel.hotelId}>
                          Hotel {hotel.hotelId} - {hotel.address}
                        </option>
                      ))}
                    </select>
                    <Input name="roomNumber" type="number" min={1} required placeholder="Room number" />
                    <Input name="price" type="number" min={0} step="0.01" required placeholder="Price" />
                    <select name="capacity" required className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                      {ROOM_CAPACITIES.map((capacity) => (
                        <option key={capacity} value={capacity}>{capacity}</option>
                      ))}
                    </select>
                    <select name="viewType" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                      <option value="">No view type</option>
                      {ROOM_VIEWS.map((view) => (
                        <option key={view} value={view}>{view}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input type="checkbox" name="extendible" className="size-4" />
                      Extendible room
                    </label>
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
              <Link href={buildReturnPath(q, "price-asc")} className="text-sm text-muted-foreground hover:text-foreground">Sort price asc</Link>
              <Link href={buildReturnPath(q, "price-desc")} className="text-sm text-muted-foreground hover:text-foreground">Sort price desc</Link>
              <Link href={buildReturnPath(q, "hotel")} className="text-sm text-muted-foreground hover:text-foreground">Sort hotel</Link>
              <Link href={buildReturnPath(q, "capacity")} className="text-sm text-muted-foreground hover:text-foreground">Sort capacity</Link>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>View</TableHead>
                  <TableHead>Extendible</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${row.hotelId}-${row.roomNumber}`}>
                    <TableCell>
                      {row.hotelId} - <span className="text-muted-foreground">{row.hotelAddress}</span>
                    </TableCell>
                    <TableCell>{row.roomNumber}</TableCell>
                    <TableCell className="capitalize">{row.capacity}</TableCell>
                    <TableCell>{formatMoney(row.price)}</TableCell>
                    <TableCell className="capitalize">{row.viewType || "none"}</TableCell>
                    <TableCell>{row.extendible ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1" />}>
                            <Pencil className="size-3.5" />
                            Edit
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Edit Room</DialogTitle>
                              <DialogDescription>Update room details while preserving composite key.</DialogDescription>
                            </DialogHeader>
                            <form action={updateRoomAction} className="space-y-3">
                              <input type="hidden" name="returnPath" value={returnPath} />
                              <Input name="hotelId" type="number" defaultValue={String(row.hotelId)} readOnly />
                              <Input name="roomNumber" type="number" defaultValue={String(row.roomNumber)} readOnly />
                              <Input name="price" type="number" min={0} step="0.01" required defaultValue={String(row.price)} />
                              <select name="capacity" required defaultValue={row.capacity} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                                {ROOM_CAPACITIES.map((capacity) => (
                                  <option key={capacity} value={capacity}>{capacity}</option>
                                ))}
                              </select>
                              <select name="viewType" defaultValue={row.viewType} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                                <option value="">No view type</option>
                                {ROOM_VIEWS.map((view) => (
                                  <option key={view} value={view}>{view}</option>
                                ))}
                              </select>
                              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <input type="checkbox" name="extendible" className="size-4" defaultChecked={row.extendible} />
                                Extendible room
                              </label>
                              <div className="flex justify-end gap-2 pt-1">
                                <Button type="submit">Save Changes</Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <form action={deleteRoomAction}>
                          <input type="hidden" name="returnPath" value={returnPath} />
                          <input type="hidden" name="hotelId" value={row.hotelId} />
                          <input type="hidden" name="roomNumber" value={row.roomNumber} />
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
