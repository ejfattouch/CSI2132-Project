"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { ReportsNav } from "@/components/reports/reports-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Building2, Users } from "lucide-react";

interface HotelCapacityData {
  hotelId: number;
  hotelAddress: string;
  chainName: string;
  starRating: number;
  totalRooms: number;
  singleRooms: number;
  doubleRooms: number;
  suiteRooms: number;
  familyRooms: number;
  totalGuestCapacity: number;
}

export default function HotelCapacityPage() {
  const [data, setData] = useState<HotelCapacityData[]>([]);
  const [filteredData, setFilteredData] = useState<HotelCapacityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/reports/hotel-capacity");

        // Handle unauthorized access (API endpoint requires role)
        if (response.status === 401) {
          // Redirect to dashboard with unauthorized message
          if (typeof window !== "undefined") {
            window.location.href = "/?unauthorized=true";
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        setData(result);
        setFilteredData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Apply filters whenever search or rating changes
  useEffect(() => {
    let filtered = data;

    // Filter by search query (chain name or address)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (hotel) =>
          hotel.chainName.toLowerCase().includes(query) ||
          hotel.hotelAddress.toLowerCase().includes(query)
      );
    }

    // Filter by star rating
    if (selectedRating) {
      const rating = parseInt(selectedRating);
      filtered = filtered.filter((hotel) => hotel.starRating === rating);
    }

    setFilteredData(filtered);
  }, [searchQuery, selectedRating, data]);

  const totalRooms = data.reduce((sum, hotel) => sum + hotel.totalRooms, 0);
  const totalCapacity = data.reduce((sum, hotel) => sum + hotel.totalGuestCapacity, 0);
  const averageRoomsPerHotel = data.length > 0 ? Math.round(totalRooms / data.length) : 0;

  const getRatingBadge = (rating: number) => {
    const stars = "★".repeat(rating);
    return (
      <span className="text-xs font-medium">
        {stars} <span className="text-muted-foreground">({rating})</span>
      </span>
    );
  };

  return (
    <AppShell>
      <div className="space-y-5 sm:space-y-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-strong sm:text-3xl">Hotel Capacity Overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View the total capacity and room type breakdown for each hotel. This helps understand inventory distribution
            across your hotel network.
          </p>
        </section>

        <ReportsNav />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="surface-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-strong">Total Hotels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-strong">{data.length}</div>
              <p className="text-xs text-muted-foreground">In network</p>
            </CardContent>
          </Card>
          <Card className="surface-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-strong">Total Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-strong">{totalRooms}</div>
              <p className="text-xs text-muted-foreground">{averageRoomsPerHotel} avg per hotel</p>
            </CardContent>
          </Card>
          <Card className="surface-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-strong">Total Guest Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-strong">{totalCapacity}</div>
              <p className="text-xs text-muted-foreground">Across all rooms</p>
            </CardContent>
          </Card>
        </div>

        <Card className="surface-panel">
          <CardHeader>
            <CardTitle className="text-base text-strong">Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-strong">Search by Chain or Address</label>
              <Input
                placeholder="e.g., Luxury Hotels, Downtown..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-strong">Filter by Star Rating</label>
              <Select value={selectedRating || ""} onValueChange={(value) => setSelectedRating(value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="All ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All ratings</SelectItem>
                  <SelectItem value="1">★ (1 Star)</SelectItem>
                  <SelectItem value="2">★★ (2 Stars)</SelectItem>
                  <SelectItem value="3">★★★ (3 Stars)</SelectItem>
                  <SelectItem value="4">★★★★ (4 Stars)</SelectItem>
                  <SelectItem value="5">★★★★★ (5 Stars)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel">
          <CardHeader>
            <CardTitle className="text-strong">Hotels and Room Breakdown</CardTitle>
            <CardDescription>Showing {filteredData.length} of {data.length} hotels</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="state-panel state-loading text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Loading report...</p>
                </div>
              </div>
            ) : error ? (
              <div className="state-panel state-error flex items-start gap-4 p-4">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-destructive">Error Loading Data</p>
                  <p className="text-xs text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-center">
                <div className="state-panel state-empty">
                  <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No hotels match your filters</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Chain & Hotel</TableHead>
                      <TableHead className="text-center">★</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Single</TableHead>
                      <TableHead className="text-right">Double</TableHead>
                      <TableHead className="text-right">Suite</TableHead>
                      <TableHead className="text-right">Family</TableHead>
                      <TableHead className="text-right">Capacity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((hotel) => (
                      <TableRow key={hotel.hotelId}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{hotel.chainName}</p>
                            <p className="text-xs text-muted-foreground">{hotel.hotelAddress}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{getRatingBadge(hotel.starRating)}</TableCell>
                        <TableCell className="text-right font-semibold">{hotel.totalRooms}</TableCell>
                        <TableCell className="text-right">{hotel.singleRooms}</TableCell>
                        <TableCell className="text-right">{hotel.doubleRooms}</TableCell>
                        <TableCell className="text-right">{hotel.suiteRooms}</TableCell>
                        <TableCell className="text-right">{hotel.familyRooms}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-mono">
                            <Users className="h-3 w-3 mr-1" />
                            {hotel.totalGuestCapacity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
