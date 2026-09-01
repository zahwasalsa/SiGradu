"use client";

import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PanduanDialog({ title, points }: { title: string; points: string[] }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <BookOpen className="size-4" /> Panduan
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Ringkasan cara menggunakan halaman ini.</DialogDescription>
        </DialogHeader>
        <ul className="flex list-disc flex-col gap-2 pl-4 text-sm">
          {points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
