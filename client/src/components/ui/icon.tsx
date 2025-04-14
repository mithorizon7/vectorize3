import { forwardRef, FC, HTMLAttributes, SVGProps, ReactSVGElement } from "react";
import { cn } from "@/lib/utils";

export interface IconProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: number;
}

const Icon = forwardRef<HTMLDivElement, IconProps>(
  ({ children, className, size = 24, ...rest }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn("flex items-center justify-center", className)} 
        style={{ width: size, height: size }}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Icon.displayName = "Icon";

// SVG logo component for SVG converter
export const SVGConverterLogo: FC<SVGProps<ReactSVGElement>> = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.75 2.75V4.5h1.5V2.75h-1.5zm3.75 1.5h-1.5v1.75h1.5V4.25zM12.75 4.5v1.75h1.5V4.5h-1.5zM8.25 4.25v1.75h1.5V4.25h-1.5zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5zM4.25 8.25v1.5H6v-1.5H4.25zm13.5 0v1.5h1.75v-1.5h-1.75zM8.25 16v1.75h1.5V16h-1.5zm7.5 0v1.75h1.5V16h-1.5zm-3 1.75V19.5h1.5v-1.75h-1.5z" />
      <path d="M12 13.75a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5z" />
    </svg>
  );
};

export default Icon;
