"use client";

import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col md:max-w-[420px]",
      className
    )}
    ref={ref}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-6 pr-8 shadow-2xl backdrop-blur-xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-out data-[state=open]:animate-in data-[swipe=end]:animate-out data-[swipe=move]:transition-none",
  {
    variants: {
      variant: {
        default: "glass border-white/[0.08] text-white",
        destructive: "glass border-red-500/20 bg-red-500/10 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      className={cn(toastVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] px-3 font-medium text-sm ring-offset-background backdrop-blur-sm transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-red-500/20 group-[.destructive]:text-red-100 group-[.destructive]:focus:ring-red-500/20 group-[.destructive]:hover:border-red-500/30 group-[.destructive]:hover:bg-red-500/20",
      className
    )}
    ref={ref}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    className={cn(
      "absolute top-2 right-2 rounded-md p-1 text-white/50 opacity-0 transition-opacity hover:bg-white/[0.08] hover:text-white focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/20 group-hover:opacity-100 group-[.destructive]:text-red-200 group-[.destructive]:focus:ring-red-400 group-[.destructive]:hover:bg-red-500/20 group-[.destructive]:hover:text-red-100",
      className
    )}
    ref={ref}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    className={cn("font-semibold text-sm text-white", className)}
    ref={ref}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    className={cn("text-sm text-white/70", className)}
    ref={ref}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  Toast,
  ToastAction,
  type ToastActionElement,
  ToastClose,
  ToastDescription,
  type ToastProps,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};
