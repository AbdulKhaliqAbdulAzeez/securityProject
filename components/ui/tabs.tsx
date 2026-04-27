"use client";

import * as React from "react";

const TabsContext = React.createContext<{
  activeValue: string;
  onChange: (value: string) => void;
} | null>(null);

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TabsContext.Provider value={{ activeValue: value, onChange: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`tabs-list ${className || ""}`}>{children}</div>;
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");

  const isActive = context.activeValue === value;
  return (
    <button
      type="button"
      className={`tabs-trigger ${isActive ? "tabs-trigger--active" : ""} ${className || ""}`}
      onClick={() => context.onChange(value)}
      aria-selected={isActive}
      role="tab"
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");

  if (context.activeValue !== value) return null;
  return (
    <div className={`tabs-content ${className || ""}`} role="tabpanel">
      {children}
    </div>
  );
}
