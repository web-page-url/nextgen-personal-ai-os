"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { api } from "@/src/lib/api-client";

const SWATCHES = ["#cc785c", "#5db8a6", "#e8a55a", "#6c6a64", "#141413"];

export function CreateCollectionDialog() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(SWATCHES[0]);
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: () => api.createCollection({ name, color }),
    onSuccess: () => {
      toast.success(`Created "${name}"`);
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
      setOpen(false);
      setName("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New collection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-normal">New collection</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Insurance"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  className="size-7 rounded-full ring-offset-2 ring-offset-background transition-shadow"
                  style={{
                    backgroundColor: swatch,
                    boxShadow: color === swatch ? `0 0 0 2px ${swatch}` : undefined,
                  }}
                  aria-label={`Choose ${swatch}`}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => create.mutate()}
            disabled={!name.trim() || create.isPending}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
