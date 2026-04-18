"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import EventForm from "@/components/EventForm";

type EventFormRedirectProps = Omit<
  ComponentProps<typeof EventForm>,
  "onProcessed"
> & {
  redirectTo?: string;
};

/**
 * Wraps EventForm and redirects after a successful create or update.
 */
export default function EventFormRedirect({
  redirectTo = "/tasks",
  ...props
}: EventFormRedirectProps) {
  const router = useRouter();

  return (
    <EventForm
      {...props}
      onProcessed={() => {
        router.push(redirectTo);
      }}
    />
  );
}
