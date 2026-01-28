"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Button } from "@workspace/ui/components/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  error?: string | null
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  emptyMessage?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  error = null,
  total,
  page = 1,
  pageSize = 20,
  totalPages = 1,
  onPageChange,
  emptyMessage = "No results found.",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: !!onPageChange,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
  })

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage)
    } else {
      table.setPageIndex(newPage - 1)
    }
  }

  const currentPage = onPageChange ? page : table.getState().pagination.pageIndex + 1
  const displayTotalPages = onPageChange ? totalPages : table.getPageCount()
  const displayTotal = total ?? data.length

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-800 bg-red-900/20 p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-md border border-slate-800 bg-slate-900/50 text-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-slate-800 bg-slate-950">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-slate-400">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-slate-800">
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-slate-400 py-8"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-slate-800 hover:bg-slate-800/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="border-slate-800">
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-slate-400 py-8"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {displayTotalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-slate-400">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, displayTotal)} of {displayTotal} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-slate-900 border-slate-700 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, displayTotalPages) }, (_, i) => {
                let pageNum: number
                if (displayTotalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= displayTotalPages - 2) {
                  pageNum = displayTotalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={
                      currentPage === pageNum
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-slate-900 border-slate-700 text-white hover:bg-slate-800"
                    }
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === displayTotalPages}
              className="bg-slate-900 border-slate-700 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

