import type { ReactNode } from "react";

type IconProps = { size?: number; className?: string };

const Svg = ({ size = 20, className, children }: IconProps & { children: ReactNode }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const ArrowRightIcon = (props: IconProps) => <Svg {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></Svg>;
export const CloseIcon = (props: IconProps) => <Svg {...props}><path d="M18 6 6 18M6 6l12 12"/></Svg>;
export const UndoIcon = (props: IconProps) => <Svg {...props}><path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/></Svg>;
export const BookmarkIcon = ({ filled = false, ...props }: IconProps & { filled?: boolean }) => <Svg {...props}><path fill={filled ? "currentColor" : "none"} d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></Svg>;
export const HeartIcon = (props: IconProps) => <Svg {...props}><path fill="currentColor" stroke="none" d="M12 21s-8-4.35-10-9.5C.5 7 3 4 6 4c2 0 3.5 1.5 4 2.5C10.5 5.5 12 4 14 4c3 0 5.5 3 4 7.5C20 16.65 12 21 12 21z"/></Svg>;
export const CheckIcon = (props: IconProps) => <Svg {...props}><path d="M20 6 9 17l-5-5"/></Svg>;
export const CopyIcon = (props: IconProps) => <Svg {...props}><rect width="13" height="13" x="9" y="9" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Svg>;
export const PrintIcon = (props: IconProps) => <Svg {...props}><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></Svg>;
