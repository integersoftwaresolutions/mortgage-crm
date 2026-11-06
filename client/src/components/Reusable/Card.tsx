import React, { ReactNode } from "react";
import { cn } from "../../utils/cn";
import HoverBorderGradient from "./Aceternity UI/HoverBorderGradient";
import Spotlight from "./Aceternity UI/Spotlight";

interface CardProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

const Card: React.FC<CardProps> = ({ children, className = "", containerClassName = "" }) => {
  return (
    <HoverBorderGradient
      containerClassName={cn("w-full max-w-full min-w-0", containerClassName)}
      className={cn(
        "bg-card border border-card-border shadow-sm shadow-card-shadow",
        "p-6",
        className
      )}
      roundedClassName="rounded-xl"
    >
      <div className="relative h-full min-w-0">
        <Spotlight className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10 h-full min-w-0">{children}</div>
      </div>
    </HoverBorderGradient>
  );
};

export default Card;
