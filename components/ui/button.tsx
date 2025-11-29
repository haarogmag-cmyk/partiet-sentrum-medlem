import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Legg til 'success' her
  variant?: "primary" | "secondary" | "us" | "danger" | "outline" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
    
    const sizeStyles = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3 text-lg"
    };
    
    const variants = {
      primary: "bg-ps-primary text-white hover:bg-ps-dark focus:ring-ps-primary shadow-md hover:shadow-lg",
      us: "bg-us-primary text-white hover:bg-us-dark focus:ring-us-primary shadow-md hover:shadow-lg",
      secondary: "bg-white text-ps-text border border-ps-primary/20 hover:bg-ps-primary/5",
      outline: "border-2 border-ps-primary text-ps-primary hover:bg-ps-primary/5",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      // NY VARIANT: SUCCESS (Grønn)
      success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-md",
      ghost: "text-ps-text/70 hover:text-ps-text hover:bg-ps-primary/5 bg-transparent shadow-none",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";