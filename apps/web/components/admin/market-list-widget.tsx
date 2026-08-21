"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Search, Edit, Map, Plus } from "lucide-react";
import Link from "next/link";

type Market = {
  id: number;
  name: string;
  state: string;
  slug: string;
  status: string;
  zipCount: number;
  parent: string | null;
};

const MOCK_DATA: Market[] = [
  { id: 166, name: "Memphis", state: "TN", slug: "memphis", status: "Active", zipCount: 42, parent: null },
  { id: 167, name: "Germantown", state: "TN", slug: "germantown", status: "Active", zipCount: 5, parent: "Memphis" },
  { id: 199, name: "Little Rock", state: "AR", slug: "littlerock", status: "Pending", zipCount: 25, parent: null },
];

export function MarketListWidget() {
  const [searchTerm, setSearchTerm] = useState("");
  const markets = MOCK_DATA; 

  const filteredMarkets = markets.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search markets..." 
            className="pl-8"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Market
        </Button>
      </div>

      <div className="rounded-md border text-foreground">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">State</TableHead>
              <TableHead className="text-muted-foreground">Parent</TableHead>
              <TableHead className="text-muted-foreground text-right">Zips</TableHead>
              <TableHead className="text-muted-foreground text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMarkets.map((market) => (
              <TableRow key={market.id} className="border-border hover:bg-accent">
                <TableCell className="font-mono text-xs text-muted-foreground">#{market.id}</TableCell>
                <TableCell className="font-medium text-lg">
                    {market.name}
                    {market.status === 'Pending' && <Badge variant="outline" className="ml-2 text-yellow-500 border-yellow-500 text-[10px]">Pending</Badge>}
                </TableCell>
                <TableCell className="text-muted-foreground">{market.state}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                    {market.parent ? <div className="flex items-center gap-1"><Map className="h-3 w-3" /> {market.parent}</div> : <span className="opacity-30">-</span>}
                </TableCell>
                <TableCell className="text-right">
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">{market.zipCount}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/markets/${market.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-400 hover:text-accent-foreground hover:bg-blue-600">
                        <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
