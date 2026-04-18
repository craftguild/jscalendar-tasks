import Link from "next/link";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentType,
  type Ref,
  type ReactNode,
} from "react";

export type ButtonVariant =
  | "primary"
  | "surface"
  | "subtle"
  | "danger"
  | "accentSoft"
  | "ghost"
  | "swatch";

export type ButtonSize =
  | "sm"
  | "md"
  | "lg"
  | "compact"
  | "icon"
  | "squareMd"
  | "swatch"
  | "floating";

export type ButtonFontWeight = "normal" | "medium" | "semibold" | "bold";

type ButtonIcon = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean;
}>;

type ButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ButtonIcon;
  iconSpin?: boolean;
  label?: ReactNode;
  fullWidth?: boolean;
  selected?: boolean;
  fontWeight?: ButtonFontWeight;
  children?: ReactNode;
};

type NativeButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type LinkButtonProps = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
  };

type ButtonProps = NativeButtonProps | LinkButtonProps;

/**
 * Joins conditional CSS class names.
 */
function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-surface hover:bg-[color:color-mix(in_oklab,var(--accent)_96%,black)]",
  surface:
    "bg-surface text-ink hover:bg-[color:color-mix(in_oklab,var(--ink)_2%,var(--surface))]",
  subtle:
    "bg-[color:color-mix(in_oklab,var(--ink)_8%,transparent)] text-ink hover:bg-[color:color-mix(in_oklab,var(--ink)_10%,transparent)]",
  danger:
    "bg-surface text-red-600 hover:bg-[color:color-mix(in_oklab,#dc2626_3%,var(--surface))]",
  accentSoft:
    "bg-surface text-accent hover:bg-[color:color-mix(in_oklab,var(--accent)_2%,var(--surface))]",
  ghost:
    "bg-transparent text-ink hover:bg-[color:color-mix(in_oklab,var(--ink)_3%,transparent)]",
  swatch: "border border-transparent hover:brightness-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1",
  md: "px-4 py-2",
  lg: "px-4 py-3",
  compact: "h-8 px-4 py-2",
  icon: "h-8 w-8 p-0",
  squareMd: "h-9 w-9 p-0",
  swatch: "h-6 w-6 rounded-full p-0",
  floating:
    "fixed bottom-6 right-6 z-40 h-20 w-20 flex-col gap-1 !rounded-full p-0",
};

const iconClasses: Record<ButtonSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-4 w-4",
  compact: "h-4 w-4",
  icon: "h-4 w-4",
  squareMd: "h-4 w-4",
  swatch: "h-4 w-4",
  floating: "h-5 w-5",
};

const fontWeightClasses: Record<ButtonFontWeight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  selected?: boolean;
  fontWeight?: ButtonFontWeight;
};

/**
 * Builds the shared class string for button-like controls.
 */
export function getButtonClassName({
  variant = "surface",
  size = "md",
  fullWidth,
  selected,
  fontWeight = "normal",
}: ButtonClassOptions) {
  return joinClasses(
    "inline-flex items-center justify-center gap-2 rounded-md shadow-sm transition duration-150 ease-out active:translate-y-px active:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100 disabled:active:translate-y-0",
    variantClasses[variant],
    sizeClasses[size],
    fontWeightClasses[fontWeight],
    fullWidth && "w-full",
    selected && "border-accent",
  );
}

/**
 * Renders the shared app button as either a native button or Next.js link.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "surface",
    size = "md",
    icon: Icon,
    iconSpin,
    label,
    fullWidth,
    selected,
    fontWeight = "normal",
    children,
    ...props
  },
  ref,
) {
  const content = (
    <>
      {Icon ? (
        <Icon
          className={joinClasses(iconClasses[size], iconSpin && "animate-spin")}
          aria-hidden={true}
        />
      ) : null}
      {label ?? children}
    </>
  );
  const classes = getButtonClassName({
    variant,
    size,
    fullWidth,
    selected,
    fontWeight,
  });

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props as LinkButtonProps;
    return (
      <Link
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        {...linkProps}
      >
        {content}
      </Link>
    );
  }

  const buttonProps = props as NativeButtonProps;
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      className={classes}
      {...buttonProps}
    >
      {content}
    </button>
  );
});

export default Button;
