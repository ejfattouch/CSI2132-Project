"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

import type { BrowseHotelsFilters, BrowseHotelsOptions, RoomCapacity } from "@/lib/browse-hotels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CAPACITY_OPTIONS: Array<{ value: RoomCapacity; label: string }> = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "suite", label: "Suite" },
  { value: "family", label: "Family" },
];

type BrowseHotelFiltersProps = {
  initialFilters: BrowseHotelsFilters;
  options: BrowseHotelsOptions;
};

function formatNumberInput(value: number | null): string {
  return value === null ? "" : String(value);
}

function normalizeNumberInput(rawValue: string): number | null {
  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

export function BrowseHotelFilters({ initialFilters, options }: BrowseHotelFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState(initialFilters);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    params.set("startDate", filters.startDate);
    params.set("endDate", filters.endDate);

    if (filters.roomCapacity) {
      params.set("roomCapacity", filters.roomCapacity);
    }
    if (filters.area) {
      params.set("area", filters.area);
    }
    if (filters.hotelChain) {
      params.set("hotelChain", filters.hotelChain);
    }
    if (filters.hotelCategory !== null) {
      params.set("hotelCategory", String(filters.hotelCategory));
    }
    if (filters.minTotalRooms !== null) {
      params.set("minTotalRooms", String(filters.minTotalRooms));
    }
    if (filters.minPrice !== null) {
      params.set("minPrice", String(filters.minPrice));
    }
    if (filters.maxPrice !== null) {
      params.set("maxPrice", String(filters.maxPrice));
    }

    return params.toString();
  }, [filters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      startTransition(() => {
        router.replace(`${pathname}?${queryString}`, { scroll: false });
      });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [pathname, queryString, router]);

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="size-4" />
          Search Filters
        </CardTitle>
        <CardDescription>
          Results refresh automatically when any filter changes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Start Date</p>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">End Date</p>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Room Capacity</p>
            <Select
              value={filters.roomCapacity || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  roomCapacity: value === "all" ? "" : (value as RoomCapacity),
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any capacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any capacity</SelectItem>
                {CAPACITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Area</p>
            <Select
              value={filters.area || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  area: value && value !== "all" ? value : "",
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any area</SelectItem>
                {options.areas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Hotel Chain</p>
            <Select
              value={filters.hotelChain || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  hotelChain: value && value !== "all" ? value : "",
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any chain</SelectItem>
                {options.hotelChains.map((chain) => (
                  <SelectItem key={chain} value={chain}>
                    {chain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Hotel Category</p>
            <Select
              value={filters.hotelCategory === null ? "all" : String(filters.hotelCategory)}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  hotelCategory: value === "all" ? null : Number(value),
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any category</SelectItem>
                {options.hotelCategories.map((category) => (
                  <SelectItem key={category} value={String(category)}>
                    {category} star
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Total Rooms In Hotel</p>
            <Select
              value={filters.minTotalRooms === null ? "all" : String(filters.minTotalRooms)}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  minTotalRooms: value === "all" ? null : Number(value),
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any size</SelectItem>
                {options.totalRoomCounts.map((roomCount) => (
                  <SelectItem key={roomCount} value={String(roomCount)}>
                    At least {roomCount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Min Price</p>
            <Input
              type="number"
              min={Math.floor(options.minKnownPrice)}
              max={Math.ceil(options.maxKnownPrice)}
              value={formatNumberInput(filters.minPrice)}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  minPrice: normalizeNumberInput(event.target.value),
                }))
              }
              placeholder={String(Math.floor(options.minKnownPrice))}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Max Price</p>
            <Input
              type="number"
              min={Math.floor(options.minKnownPrice)}
              max={Math.ceil(options.maxKnownPrice)}
              value={formatNumberInput(filters.maxPrice)}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  maxPrice: normalizeNumberInput(event.target.value),
                }))
              }
              placeholder={String(Math.ceil(options.maxKnownPrice))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/70 pt-3">
          <p className="text-xs text-muted-foreground">
            {isPending ? "Updating available rooms..." : "Filters are in sync."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setFilters(initialFilters)}
          >
            <X className="size-3.5" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
