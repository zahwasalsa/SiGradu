"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

export function ExportCsvButton({
  rows,
  filename,
}: {
  rows: Record<string, string | number>[];
  filename: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={rows.length === 0}
      onClick={() => {
        const csv = toCsv(rows);
        const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Download className="size-4" /> Ekspor CSV
    </Button>
  );
}
