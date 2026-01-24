"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

// Mock data for demonstration
const MOCK_MARKETS = [
  {
    id: 1,
    name: "Austin Metro",
    state: "TX",
    parentMarket: null,
    zipCount: 42,
    status: "active",
  },
  {
    id: 2,
    name: "Dallas Fort Worth",
    state: "TX",
    parentMarket: null,
    zipCount: 156,
    status: "active",
  },
  {
    id: 3,
    name: "Houston",
    state: "TX",
    parentMarket: null,
    zipCount: 203,
    status: "active",
  },
  {
    id: 4,
    name: "Round Rock",
    state: "TX",
    parentMarket: "Austin Metro",
    zipCount: 8,
    status: "hidden",
  },
  {
    id: 5,
    name: "San Antonio",
    state: "TX",
    parentMarket: null,
    zipCount: 89,
    status: "active",
  },
];

export function MarketList() {
  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      console.log("Delete market:", id);
      // TODO: Implement delete logic
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Markets</h2>
          <p className="text-muted-foreground">
            Manage your markets and territories
          </p>
        </div>
        <Link href="/admin/markets/create">
          <Button>Create Market</Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Parent Market</TableHead>
              <TableHead className="text-right">Zip Count</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_MARKETS.map((market) => (
              <TableRow key={market.id}>
                <TableCell className="font-medium">{market.id}</TableCell>
                <TableCell>{market.name}</TableCell>
                <TableCell>{market.state}</TableCell>
                <TableCell>
                  {market.parentMarket ? (
                    <span className="text-muted-foreground">
                      {market.parentMarket}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">{market.zipCount}</TableCell>
                <TableCell>
                  <Badge
                    variant={market.status === "active" ? "default" : "secondary"}
                  >
                    {market.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/admin/markets/${market.id}`}
                          className="flex items-center"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(market.id, market.name)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
