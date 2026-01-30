import { Prisma } from "@prisma/client";

/**
 * Deeply clones an object and converts Prisma.Decimal values to plain numbers.
 * Also handles Dates if they are passed to client components (Next.js supports Dates but this is safe).
 * Use this to wrap server action returns that include Decimal fields.
 */
export function serialize<T>(data: T): T {
    if (data === null || data === undefined) return data;

    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => serialize(item)) as any;
    }

    // Handle Prisma Decimal
    if (Prisma.Decimal.isDecimal(data)) {
        return (data as any).toNumber();
    }

    // Handle Dates (Next.js handles these, but if we wanted to stringify them we could)
    // For now we keep them as Dates as Next.js 13+ supports them in server actions/props.
    if (data instanceof Date) {
        return data as any;
    }

    // Handle Objects
    if (typeof data === 'object') {
        const result: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                result[key] = serialize(data[key]);
            }
        }
        return result as T;
    }

    return data;
}
