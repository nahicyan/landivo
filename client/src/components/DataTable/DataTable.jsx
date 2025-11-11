// client/src/components/DataTable/DataTable.jsx
"use client";

import React from "react";
import {
  Table as ShadcnTable,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export function DataTable({ columns, data }) {
  return (
    <div className="rounded-md border">
      <ShadcnTable>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.accessorKey || column.id}>
                {/* Check if header is a function and call it, otherwise render as text */}
                {typeof column.header === "function"
                  ? column.header({ table: {} }) // Call the function to get the JSX
                  : column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column.accessorKey || column.id}>
                  {column.cell
                    ? column.cell({ row: { original: row, id: index } })
                    : row[column.accessorKey]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </ShadcnTable>
    </div>
  );
}