import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CircleCheck } from "lucide-react";

import { requireRole } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/app/app-shell";
import { BrowseHotelFilters } from "@/components/browse-hotels/browse-hotel-filters";
import {
  getBrowseHotelsOptions,
  parseBrowseHotelFilters,
  searchAvailableRooms,
  type BrowseHotelsSearchParams,
} from "@/lib/browse-hotels";

export const dynamic = "force-dynamic";

type BrowseHotelsPageProps = {
  searchParams: Promise<BrowseHotelsSearchParams>;
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(price);
}

export default async function BrowseHotelsPage({ searchParams }: BrowseHotelsPageProps) {
  // Customer role only
  const session = await requireRole("customer");
  if (!session) {
    redirect("/?unauthorized=true");
  }
  const params = await searchParams;
  const parsedFilters = parseBrowseHotelFilters(params);
  const notice = typeof params.notice === "string" ? params.notice : "";
  const error = typeof params.error === "string" ? params.error : "";

  const browseParams = new URLSearchParams();
  browseParams.set("startDate", parsedFilters.startDate);
  browseParams.set("endDate", parsedFilters.endDate);
  if (parsedFilters.roomCapacity) browseParams.set("roomCapacity", parsedFilters.roomCapacity);
  if (parsedFilters.area) browseParams.set("area", parsedFilters.area);
  if (parsedFilters.hotelChain) browseParams.set("hotelChain", parsedFilters.hotelChain);
  if (parsedFilters.hotelCategory !== null) browseParams.set("hotelCategory", String(parsedFilters.hotelCategory));
  if (parsedFilters.minTotalRooms !== null) browseParams.set("minTotalRooms", String(parsedFilters.minTotalRooms));
  if (parsedFilters.minPrice !== null) browseParams.set("minPrice", String(parsedFilters.minPrice));
  if (parsedFilters.maxPrice !== null) browseParams.set("maxPrice", String(parsedFilters.maxPrice));

  const browsePath = `/browse-hotels?${browseParams.toString()}`;

  const [options, rooms] = await Promise.all([
    getBrowseHotelsOptions(),
    searchAvailableRooms(parsedFilters),
  ]);

  return (
    <AppShell
      pageLabel="Customer Read-Only Flow"
      pageTitle="Browse Available Hotels"
    >
      <div className="space-y-5">
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

        <BrowseHotelFilters initialFilters={parsedFilters} options={options} />

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Available Rooms</CardTitle>
              <CardDescription>
                Showing inventory available from {parsedFilters.startDate} to {parsedFilters.endDate}.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit px-3 py-1">
              {rooms.length} results
            </Badge>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-8 text-center">
                <p className="font-medium">No available rooms match the current filters.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Adjust dates, area, chain, or price to widen your search.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {rooms.map((room) => (
                  <article
                    key={`${room.hotelId}-${room.roomNumber}`}
                    className="rounded-xl border border-border/70 bg-background/90 p-4 shadow-sm"
                  >
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{room.chainName}</p>
                      <h3 className="font-heading text-lg font-semibold">{room.area}</h3>
                      <p className="text-sm text-muted-foreground">
                        Hotel #{room.hotelId} • {room.hotelCategory} star • {room.totalRoomsInHotel} rooms total
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-md bg-muted/45 p-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Room</p>
                        <p className="font-medium">#{room.roomNumber}</p>
                      </div>
                      <div className="rounded-md bg-muted/45 p-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Capacity</p>
                        <p className="font-medium capitalize">{room.roomCapacity}</p>
                      </div>
                      <div className="rounded-md bg-muted/45 p-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Price</p>
                        <p className="font-medium">{formatPrice(room.price)}</p>
                      </div>
                      <div className="rounded-md bg-muted/45 p-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">View</p>
                        <p className="font-medium capitalize">{room.viewType}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Extendible bed</span>
                      <Badge variant={room.extendible ? "default" : "outline"}>
                        {room.extendible ? "Yes" : "No"}
                      </Badge>
                    </div>

                    <div className="mt-4">
                      <Link
                        href={`/bookings/new?${new URLSearchParams({
                          hotelId: String(room.hotelId),
                          roomNumber: String(room.roomNumber),
                          startDate: parsedFilters.startDate,
                          endDate: parsedFilters.endDate,
                          area: room.area,
                          chainName: room.chainName,
                          returnBrowse: browsePath,
                        }).toString()}`}
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                      >
                        Book This Room
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
