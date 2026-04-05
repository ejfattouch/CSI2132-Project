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
import { createHotelAction, deleteHotelAction, updateHotelAction } from "@/app/admin/actions";
import { db } from "@/db";

type SearchParamValue = string | string[] | undefined;

type HotelsPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

type HotelRow = {
  hotelId: number;
  chainAddress: string;
  chainName: string;
  address: string;
  starRating: number;
  email: string;
  managerSsn: string;
};

type ChainOption = {
  centralAddress: string;
  chainName: string;
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
  return `/admin/hotels${query ? `?${query}` : ""}`;
}

export default async function HotelsAdminPage({ searchParams }: HotelsPageProps) {
  const params = await searchParams;
  const q = pickString(params.q);
  const sort = pickString(params.sort) || "id-desc";
  const notice = pickString(params.notice);
  const error = pickString(params.error);

  const orderBy: SQL =
    sort === "id-asc"
      ? sql`h.hotel_id ASC`
      : sort === "star-desc"
        ? sql`h.star_rating DESC, h.hotel_id ASC`
        : sort === "star-asc"
          ? sql`h.star_rating ASC, h.hotel_id ASC`
          : sql`h.hotel_id DESC`;

  const searchPattern = `%${q}%`;

  const [hotelsResult, chainsResult] = await Promise.all([
    db.execute(sql`
      SELECT
        h.hotel_id AS "hotelId",
        h.hotel_chain_central_address AS "chainAddress",
        hc.chain_name AS "chainName",
        h.address AS address,
        h.star_rating AS "starRating",
        h.email AS email,
        COALESCE(h.manager_ssn, '') AS "managerSsn"
      FROM hotel h
      INNER JOIN hotel_chain hc ON hc.central_address = h.hotel_chain_central_address
      WHERE ${q ? sql`(h.address ILIKE ${searchPattern} OR h.email ILIKE ${searchPattern} OR hc.chain_name ILIKE ${searchPattern})` : sql`TRUE`}
      ORDER BY ${orderBy}
      LIMIT 200
    `),
    db.execute(sql`
      SELECT central_address AS "centralAddress", chain_name AS "chainName"
      FROM hotel_chain
      ORDER BY chain_name ASC
    `),
  ]);

  const rows: HotelRow[] = hotelsResult.rows.map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      hotelId: readNumber(raw.hotelId),
      chainAddress: readString(raw.chainAddress),
      chainName: readString(raw.chainName),
      address: readString(raw.address),
      starRating: readNumber(raw.starRating),
      email: readString(raw.email),
      managerSsn: readString(raw.managerSsn),
    };
  });

  const chainOptions: ChainOption[] = chainsResult.rows.map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      centralAddress: readString(raw.centralAddress),
      chainName: readString(raw.chainName),
    };
  });

  const returnPath = buildReturnPath(q, sort);

  return (
    <AppShell pageLabel="Admin CRUD" pageTitle="Hotel Management">
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
              <CardTitle>Hotels</CardTitle>
              <CardDescription>Manage hotel records and chain assignments.</CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <form action="/admin/hotels" className="flex items-center gap-2">
                <Input name="q" placeholder="Search address, chain, email" defaultValue={q} className="w-56" />
                <input type="hidden" name="sort" value={sort} />
                <Button type="submit" variant="outline">Search</Button>
              </form>

              <Dialog>
                <DialogTrigger render={<Button className="gap-1.5" />}>
                  <Plus className="size-4" />
                  New Hotel
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Hotel</DialogTitle>
                    <DialogDescription>Add a hotel to an existing chain.</DialogDescription>
                  </DialogHeader>
                  <form action={createHotelAction} className="space-y-3">
                    <input type="hidden" name="returnPath" value={returnPath} />
                    <select name="chainAddress" required className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                      {chainOptions.map((chain) => (
                        <option key={chain.centralAddress} value={chain.centralAddress}>
                          {chain.chainName}
                        </option>
                      ))}
                    </select>
                    <Input name="address" required placeholder="Hotel address" />
                    <Input name="starRating" type="number" min={1} max={5} required placeholder="Star rating (1-5)" />
                    <Input name="email" required placeholder="Hotel email" />
                    <Input name="managerSsn" placeholder="Manager SSN (optional)" />
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
              <Link href={buildReturnPath(q, "id-desc")} className="text-sm text-muted-foreground hover:text-foreground">Sort newest ID</Link>
              <Link href={buildReturnPath(q, "id-asc")} className="text-sm text-muted-foreground hover:text-foreground">Sort oldest ID</Link>
              <Link href={buildReturnPath(q, "star-desc")} className="text-sm text-muted-foreground hover:text-foreground">Sort stars desc</Link>
              <Link href={buildReturnPath(q, "star-asc")} className="text-sm text-muted-foreground hover:text-foreground">Sort stars asc</Link>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Stars</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Manager SSN</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.hotelId}>
                    <TableCell>{row.hotelId}</TableCell>
                    <TableCell>{row.chainName}</TableCell>
                    <TableCell>{row.address}</TableCell>
                    <TableCell>{row.starRating}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.managerSsn || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1" />}>
                            <Pencil className="size-3.5" />
                            Edit
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Edit Hotel</DialogTitle>
                              <DialogDescription>Update chain, contact, and quality fields.</DialogDescription>
                            </DialogHeader>
                            <form action={updateHotelAction} className="space-y-3">
                              <input type="hidden" name="returnPath" value={returnPath} />
                              <input type="hidden" name="hotelId" value={String(row.hotelId)} />
                              <select name="chainAddress" required defaultValue={row.chainAddress} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                                {chainOptions.map((chain) => (
                                  <option key={chain.centralAddress} value={chain.centralAddress}>
                                    {chain.chainName}
                                  </option>
                                ))}
                              </select>
                              <Input name="address" required defaultValue={row.address} />
                              <Input name="starRating" type="number" min={1} max={5} required defaultValue={String(row.starRating)} />
                              <Input name="email" required defaultValue={row.email} />
                              <Input name="managerSsn" defaultValue={row.managerSsn} placeholder="Manager SSN (optional)" />
                              <div className="flex justify-end gap-2 pt-1">
                                <Button type="submit">Save Changes</Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <form action={deleteHotelAction}>
                          <input type="hidden" name="returnPath" value={returnPath} />
                          <input type="hidden" name="hotelId" value={String(row.hotelId)} />
                          <Button type="submit" size="sm" variant="destructive">Delete</Button>
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
