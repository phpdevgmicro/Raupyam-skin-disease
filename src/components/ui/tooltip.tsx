"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

// Global state to track which tooltip is currently open
let currentOpenTooltipId: string | null = null;
const tooltipStateListeners = new Set<(id: string | null) => void>();

const notifyTooltipStateChange = (id: string | null) => {
  currentOpenTooltipId = id;
  tooltipStateListeners.forEach(listener => listener(id));
};

// Context for managing tooltip open state
interface TooltipContextValue {
  open: boolean;
  toggle: () => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

const useTooltipContext = () => {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be used within a Tooltip');
  }
  return context;
};

// Tooltip wrapper that provides controlled state and only honors close events from Radix
const Tooltip = ({ children, ...props }: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) => {
  const tooltipId = React.useId();
  const [open, setOpen] = React.useState(false);
  
  // Listen to global tooltip state changes
  React.useEffect(() => {
    const listener = (openId: string | null) => {
      if (openId !== tooltipId && open) {
        setOpen(false);
      }
    };
    
    tooltipStateListeners.add(listener);
    return () => {
      tooltipStateListeners.delete(listener);
    };
  }, [tooltipId, open]);
  
  const toggle = React.useCallback(() => {
    setOpen(prev => {
      const newState = !prev;
      if (newState) {
        // Close any other open tooltips
        notifyTooltipStateChange(tooltipId);
      } else {
        notifyTooltipStateChange(null);
      }
      return newState;
    });
  }, [tooltipId]);

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    // Only honor close events (Escape, blur, outside click)
    // Ignore hover/focus open events - we control those via click
    if (!newOpen) {
      setOpen(false);
      if (currentOpenTooltipId === tooltipId) {
        notifyTooltipStateChange(null);
      }
    }
  }, [tooltipId]);

  return (
    <TooltipContext.Provider value={{ open, toggle }}>
      <TooltipPrimitive.Root 
        open={open} 
        onOpenChange={handleOpenChange}
        disableHoverableContent={true}
        {...props}
      >
        {children}
      </TooltipPrimitive.Root>
    </TooltipContext.Provider>
  );
};

// Custom TooltipTrigger that only responds to clicks and keyboard (Enter/Space)
const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ onClick, onPointerEnter, onPointerLeave, onFocus, onKeyDown, ...props }, ref) => {
  const { toggle } = useTooltipContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
    onKeyDown?.(e);
  };

  // Suppress hover/focus events that would trigger Radix's default opening
  const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onPointerEnter?.(e);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onPointerLeave?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onFocus?.(e);
  };

  return (
    <TooltipPrimitive.Trigger
      ref={ref}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      {...props}
    />
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
