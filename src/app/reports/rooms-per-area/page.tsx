"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { ReportsNav } from "@/components/reports/reports-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MapPin } from "lucide-react";

interface RoomsPerAreaData {
  area: string;
  availableRooms: number;
}

export default function RoomsPerAreaPage() {
  const [data, setData] = useState<RoomsPerAreaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/reports/rooms-per-area");

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
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const totalRooms = data.reduce((sum, row) => sum + row.availableRooms, 0);
  const averageRoomsPerArea = data.length > 0 ? Math.round(totalRooms / data.length) : 0;

  return (
    <AppShell>
      <div className="space-y-5 sm:space-y-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-strong sm:text-3xl">Available Rooms per Area</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View the number of available rooms currently available in each hotel location. This data excludes rooms with
            active bookings or rentings today.
          </p>
        </section>

        <ReportsNav />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="surface-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-strong">Total Available Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-strong">{totalRooms}</div>
              <p className="text-xs text-muted-foreground">Across {data.length} areas</p>
            </CardContent>
          </Card>
          <Card className="surface-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-strong">Average per Area</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-strong">{averageRoomsPerArea}</div>
              <p className="text-xs text-muted-foreground">Rooms per location</p>
            </CardContent>
          </Card>
        </div>

        <Card className="surface-panel">
          <CardHeader>
            <CardTitle className="text-strong">Areas and Room Availability</CardTitle>
            <CardDescription>Sorted by available rooms (highest first)</CardDescription>
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
            ) : data.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-center">
                <div className="state-panel state-empty">
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No areas found</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Area (Hotel Address)</TableHead>
                      <TableHead className="text-right">Available Rooms</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.area}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="font-mono">
                            {row.availableRooms}
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
