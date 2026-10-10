"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import type { AdminRole } from "@/generated/prisma/enums";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

/**
 * Small-screen navigation drawer built on a modal <dialog>: the browser puts
 * it in the top layer, makes the rest of the page inert, moves focus inside,
 * closes on Escape and restores focus to the trigger on close.
 */
export function MobileNav({ role }: { role: AdminRole }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const close = () => dialogRef.current?.close();

  const openDrawer = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (desktop.matches) dialogRef.current?.close();
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="nav-drawer"
        className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface-raised hover:text-fg lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>

      {/* The dialog fills the viewport; a click that lands on it (not on the
          sheet) is a click on the dimmed area and dismisses the drawer. */}
      <dialog
        ref={dialogRef}
        id="nav-drawer"
        aria-label="Main navigation"
        className="nav-drawer"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <nav aria-label="Main navigation" className="nav-drawer-sheet flex flex-col gap-4 border-r border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <Brand />
            <button
              type="button"
              onClick={close}
              aria-label="Close navigation menu"
              className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface-raised hover:text-fg"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <NavLinks role={role} onNavigate={close} />
        </nav>
      </dialog>
    </>
  );
}
