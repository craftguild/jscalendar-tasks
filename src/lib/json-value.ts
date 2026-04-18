import type { Prisma } from "@/generated/prisma/client";

export type AppJsonPrimitive = string | number | boolean | null;
export type AppJsonValue = AppJsonPrimitive | AppJsonValue[] | AppJsonObject;
export type AppJsonObject = { [key: string]: AppJsonValue };

/**
 * Checks whether an application JSON value is a plain JSON object.
 */
export function isAppJsonObject(value: AppJsonValue): value is AppJsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Converts Prisma JSON values into the app's recursive JSON value type.
 */
export function fromPrismaJsonValue(value: Prisma.JsonValue): AppJsonValue {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => fromPrismaJsonValue(entry));
  }

  const result: AppJsonObject = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = entry === undefined ? null : fromPrismaJsonValue(entry);
  }
  return result;
}
