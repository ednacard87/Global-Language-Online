import * as React from "react";
import type { SVGProps } from "react";
import { Ear, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SiteLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

export const A1Icon = (props: React.ComponentProps<'svg'>) => (
    <svg {...props} viewBox="0 0 24 24">
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">A1</text>
    </svg>
);
  
export const A2Icon = (props: React.ComponentProps<'svg'>) => (
    <svg {...props} viewBox="0 0 24 24">
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">A2</text>
    </svg>
);

export const B1Icon = (props: React.ComponentProps<'svg'>) => (
    <svg {...props} viewBox="0 0 24 24">
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">B1</text>
    </svg>
);
  
export const B2Icon = (props: React.ComponentProps<'svg'>) => (
    <svg {...props} viewBox="0 0 24 24">
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">B2</text>
    </svg>
);

export const TetrisIcon = (props: React.ComponentProps<'svg'>) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="8" width="5" height="5" />
      <rect x="9" y="8" width="5" height="5" />
      <rect x="14" y="8" width="5" height="5" />
      <rect x="9" y="13" width="5" height="5" />
    </svg>
);
