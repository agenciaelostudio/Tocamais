import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}
    {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props} />
))
CardHeader.displayName = "CardHeader"

const GlassCard = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("glass-card", className)}
    {...props} />
))
GlassCard.displayName = "GlassCard"

const NeonCard = React.forwardRef(({ className, glow = "purple", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border bg-card text-card-foreground transition-all duration-300",
      glow === "purple" && "border-primary/20 shadow-glow-primary hover:shadow-neon hover:border-primary/40",
      glow === "green" && "border-accent/20 shadow-glow-accent hover:shadow-neon-green hover:border-accent/40",
      className
    )}
    {...props} />
))
NeonCard.displayName = "NeonCard"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, GlassCard, NeonCard, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
