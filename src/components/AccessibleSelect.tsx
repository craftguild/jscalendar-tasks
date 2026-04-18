"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { HiChevronDown } from "react-icons/hi2";
import Button from "@/components/Button";
import { useI18n } from "@/lib/i18n";

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type AccessibleSelectProps<T extends string | number> = {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  labelClassName?: string;
  buttonClassName?: string;
  listClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  combobox?: boolean;
  listAlign?: "left" | "right";
  inputValue?: string;
  onInputChange?: (value: string) => void;
  excludedValues?: T[];
  blurOnSelect?: boolean;
  renderOption?: (option: SelectOption<T>, selected: boolean) => ReactNode;
};

/**
 * Renders an accessible select or combobox with keyboard navigation.
 */
export default function AccessibleSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
  labelClassName,
  buttonClassName,
  listClassName,
  open,
  onOpenChange,
  placeholder,
  combobox,
  listAlign = "left",
  inputValue,
  onInputChange,
  excludedValues,
  blurOnSelect,
  renderOption,
}: AccessibleSelectProps<T>) {
  const { t } = useI18n();
  /**
   * Joins conditional CSS class names for the select internals.
   */
  const joinClasses = (...values: Array<string | false | null | undefined>) =>
    values.filter(Boolean).join(" ");
  const [openInternal, setOpenInternal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [openUp, setOpenUp] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const suppressFocusOpenRef = useRef(false);
  const listboxId = useId();
  const labelId = `${listboxId}-label`;
  const isCombobox = Boolean(combobox);
  const inputText = inputValue ?? "";

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const visibleOptions = useMemo(() => {
    if (!excludedValues || excludedValues.length === 0) return options;
    const excluded = new Set(excludedValues);
    return options.filter((option) => !excluded.has(option.value));
  }, [excludedValues, options]);

  const filteredOptions = useMemo(() => {
    if (!isCombobox) return visibleOptions;
    const keyword = inputText.trim().toLowerCase();
    if (!keyword) return visibleOptions;
    return visibleOptions.filter((option) =>
      option.label.toLowerCase().includes(keyword),
    );
  }, [inputText, isCombobox, visibleOptions]);

  const isOpen = open ?? openInternal;

  /**
   * Updates controlled or uncontrolled open state.
   */
  const setOpen = useCallback(
    (next: boolean) => {
      if (onOpenChange) onOpenChange(next);
      if (open === undefined) {
        setOpenInternal(next);
      }
    },
    [onOpenChange, open],
  );

  useEffect(() => {
    if (!isOpen) return;
    const index = filteredOptions.findIndex((option) => option.value === value);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(index >= 0 ? index : 0);
  }, [filteredOptions, isOpen, value]);

  /**
   * Chooses whether the option list should open upward or downward.
   */
  function decideOpenDirection() {
    const anchor = anchorRef.current ?? buttonRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const estimatedListHeight = Math.min(options.length * 36 + 16, 224);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUp =
      spaceBelow < estimatedListHeight && spaceAbove > spaceBelow;
    setOpenUp(shouldOpenUp);
  }

  useEffect(() => {
    /**
     * Closes the option list when clicking outside the select.
     */
    function handleClickOutside(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const insideList = listRef.current && listRef.current.contains(target);
      const insideButton =
        buttonRef.current && buttonRef.current.contains(target);
      const insideAnchor =
        anchorRef.current && anchorRef.current.contains(target);
      const insideInput = inputRef.current && inputRef.current.contains(target);
      if (!insideList && !insideButton && !insideInput && !insideAnchor) {
        setOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setOpen]);

  /**
   * Applies the active option and restores focus according to select mode.
   */
  function commitSelection(index: number) {
    const option = filteredOptions[index];
    if (option) {
      setOpen(false);
      onChange(option.value);
      if (blurOnSelect) {
        inputRef.current?.blur();
        buttonRef.current?.blur();
      } else if (isCombobox) {
        suppressFocusOpenRef.current = true;
        inputRef.current?.focus();
        window.setTimeout(() => {
          suppressFocusOpenRef.current = false;
        }, 0);
      } else {
        buttonRef.current?.focus();
      }
    }
  }

  /**
   * Handles keyboard opening from the trigger button.
   */
  function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      decideOpenDirection();
      setOpen(true);
    }
  }

  /**
   * Handles keyboard opening from the combobox input.
   */
  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (event.key === "Enter") {
      event.preventDefault();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      decideOpenDirection();
      setOpen(true);
    }
  }

  /**
   * Handles listbox keyboard navigation and selection.
   */
  function handleListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commitSelection(activeIndex);
    }
  }

  return (
    <div
      className={joinClasses(
        "flex items-center gap-3",
        disabled && "opacity-60",
        isCombobox && "w-full",
      )}
    >
      <span
        id={labelId}
        className={
          labelClassName ??
          "uppercase text-[color:color-mix(in oklab,var(--ink) 55%,transparent)]"
        }
      >
        {label}
      </span>
      <div className={joinClasses("relative", isCombobox && "w-full")}>
        {isCombobox ? (
          <div ref={anchorRef} className="flex items-center gap-2 w-full">
            <input
              ref={inputRef}
              className={
                buttonClassName ??
                `min-w-[12rem] rounded-md px-3 py-2 shadow-sm transition ${
                  disabled
                    ? "cursor-not-allowed bg-[color:color-mix(in oklab,var(--ink) 8%,transparent)] text-[color:color-mix(in oklab,var(--ink) 55%,transparent)]"
                    : "bg-surface"
                }`
              }
              value={inputText}
              placeholder={placeholder ?? ""}
              onChange={(event) => {
                if (onInputChange) onInputChange(event.target.value);
                if (!isOpen) {
                  decideOpenDirection();
                  setOpen(true);
                }
              }}
              onFocus={() => {
                if (disabled) return;
                if (suppressFocusOpenRef.current) return;
                decideOpenDirection();
                setOpen(true);
              }}
              onKeyDown={handleInputKeyDown}
              disabled={disabled}
            />
          </div>
        ) : (
          <Button
            ref={buttonRef}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={`${labelId} ${listboxId}-button`}
            id={`${listboxId}-button`}
            variant="surface"
            size="md"
            onClick={() => {
              if (disabled) return;
              if (!isOpen) {
                decideOpenDirection();
                setOpen(true);
                return;
              }
              setOpen(false);
            }}
            onKeyDown={handleButtonKeyDown}
            disabled={disabled}
          >
            <span>
              {selectedOption ? selectedOption.label : (placeholder ?? "")}
            </span>
            <span
              aria-hidden="true"
              className={joinClasses(
                "text-[color:color-mix(in oklab,var(--ink) 55%,transparent)] transition-transform",
                isOpen && "rotate-180",
              )}
            >
              <HiChevronDown className="h-3.5 w-3.5" />
            </span>
          </Button>
        )}
        {isOpen && !disabled && (
          <div
            ref={listRef}
            role="listbox"
            aria-labelledby={labelId}
            tabIndex={0}
            className={joinClasses(
              listClassName ??
                "absolute z-20 max-h-56 w-max max-w-[70vw] overflow-auto rounded-md bg-surface p-1 shadow-md focus:outline-none",
              openUp ? "bottom-full mb-2" : "top-full mt-2",
              listAlign === "right" ? "right-0" : "left-0",
            )}
            onKeyDown={handleListKeyDown}
          >
            {filteredOptions.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              const optionId = `${listboxId}-option-${index}`;
              return (
                <div
                  id={optionId}
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50 ${
                    isActive ? "bg-gray-50" : ""
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    commitSelection(index);
                  }}
                >
                  {renderOption ? (
                    renderOption(option, isSelected)
                  ) : (
                    <>
                      <span className="whitespace-nowrap">{option.label}</span>
                      {isSelected && (
                        <span className="text-accent">{t("selected")}</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
