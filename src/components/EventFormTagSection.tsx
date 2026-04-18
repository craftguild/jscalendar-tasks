"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlinePlus, HiOutlineXMark } from "react-icons/hi2";
import AccessibleSelect from "@/components/AccessibleSelect";
import Button from "@/components/Button";
import FormSection from "@/components/FormSection";
import { useI18n } from "@/lib/i18n";
import { TAG_COLORS } from "@/lib/tag-colors";
import type { TagValue } from "@/components/EventForm";

type EventFormTagSectionProps = {
  tags: TagValue[];
  tagOptions: TagValue[];
  tagInput: string;
  tagColor: string | null;
  dropdownOpen: boolean;
  onTagInputChange: (value: string) => void;
  onTagColorChange: (value: string | null) => void;
  onDropdownOpenChange: (open: boolean) => void;
  onAddTag: (value: string) => void;
  onRemoveTag: (name: string) => void;
};

/**
 * Renders tag selection, creation, color choice, and selected tag chips.
 */
export default function EventFormTagSection({
  tags,
  tagOptions,
  tagInput,
  tagColor,
  dropdownOpen,
  onTagInputChange,
  onTagColorChange,
  onDropdownOpenChange,
  onAddTag,
  onRemoveTag,
}: EventFormTagSectionProps) {
  const { t } = useI18n();
  const [colorOpen, setColorOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    /**
     * Closes the tag color palette when clicking outside it.
     */
    function handleClickOutside(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (colorRef.current && !colorRef.current.contains(target)) {
        setColorOpen(false);
      }
    }
    if (colorOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [colorOpen]);

  /**
   * Returns the color associated with an existing tag option.
   */
  function getTagColor(name: string): string | undefined {
    const found = tagOptions.find((tag) => tag.name === name);
    return found?.color ?? undefined;
  }

  /**
   * Applies a selected tag option and closes the tag dropdown.
   */
  function handleSelectTag(value: string) {
    const existing = tagOptions.find((tag) => tag.name === value);
    if (existing && existing.color) {
      onTagColorChange(existing.color);
    }
    onAddTag(value);
    onDropdownOpenChange(false);
  }

  return (
    <FormSection>
      <label className="">
        {t("tag")}
        <div className="mt-2 flex flex-wrap items-center gap-2 md:w-1/2">
          <div ref={colorRef} className="relative">
            <Button
              type="button"
              variant="surface"
              size="icon"
              onClick={() => setColorOpen((prev) => !prev)}
              aria-label={t("selectTagColor")}
            >
              <span
                className={`h-4 w-4 rounded-full ${tagColor ? "" : "border border-gray-100"}`}
                style={tagColor ? { backgroundColor: tagColor } : undefined}
              />
            </Button>
            {colorOpen && (
              <div className="absolute z-20 mt-2 grid w-44 grid-cols-4 place-items-center gap-2 rounded-md bg-surface p-3 shadow-md">
                {TAG_COLORS.map((color) => (
                  <Button
                    key={color}
                    type="button"
                    variant="swatch"
                    size="swatch"
                    selected={tagColor === color}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      onTagColorChange(color);
                      setColorOpen(false);
                    }}
                    aria-label={`color ${color}`}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex-1">
            <AccessibleSelect
              label={t("tag")}
              labelClassName="sr-only"
              value={tagInput}
              options={tagOptions.map((tag) => ({
                value: tag.name,
                label: tag.name,
              }))}
              onChange={handleSelectTag}
              open={dropdownOpen}
              onOpenChange={onDropdownOpenChange}
              combobox
              inputValue={tagInput}
              onInputChange={onTagInputChange}
              excludedValues={tags.map((tag) => tag.name)}
              blurOnSelect
              placeholder={t("tagPlaceholder")}
              buttonClassName="w-full rounded-md bg-surface px-3 py-2 shadow-sm h-8"
              listClassName="absolute z-20 max-h-56 w-max max-w-[70vw] overflow-auto rounded-md bg-surface p-1 shadow-md focus:outline-none"
              renderOption={(option, selected) => {
                const color = getTagColor(option.value);
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: color ?? "#f9fafb" }}
                      />
                      <span className="whitespace-nowrap">{option.label}</span>
                    </div>
                    {selected && (
                      <span className="text-accent">{t("selected")}</span>
                    )}
                  </>
                );
              }}
            />
          </div>
          <Button
            type="button"
            variant="surface"
            size="compact"
            icon={HiOutlinePlus}
            label={t("add")}
            onClick={() => onAddTag(tagInput)}
          />
        </div>
      </label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Button
              key={`${tag.name}-${tag.color}-${index}`}
              type="button"
              variant="ghost"
              size="sm"
              icon={HiOutlineXMark}
              label={
                <>
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full align-middle"
                    style={{ backgroundColor: tag.color ?? undefined }}
                  />
                  {tag.name}
                </>
              }
              onClick={() => onRemoveTag(tag.name)}
            />
          ))}
        </div>
      )}
    </FormSection>
  );
}
