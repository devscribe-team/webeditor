"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "#ffffff", // White background
          "--normal-text": "#000000", // Black text
          "--normal-border": "#e5e7eb", // Light gray border
          "--success-bg": "#ffffff", // White success background
          "--success-text": "#059669", // Green success text
          "--error-bg": "#ffffff", // White error background
          "--error-text": "#dc2626", // Red error text
          "--info-bg": "#ffffff", // White info background
          "--info-text": "#2563eb", // Blue info text
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
export { toast } from "sonner";
