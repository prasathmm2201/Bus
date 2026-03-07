import prisma from "@/lib/prisma";

/**
 * Generates a unique, secure coupon code
 * Format: {PREFIX}-{RANDOM_ALPHANUMERIC}
 * Example: WELCOME-X7K9M2
 */
export async function generateCouponCode(prefix: string = "COUPON"): Promise<string> {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars: 0, O, I, 1
    const randomLength = 6;

    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
        // Generate random alphanumeric string
        let randomPart = "";
        for (let i = 0; i < randomLength; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            randomPart += characters[randomIndex];
        }

        code = `${prefix.toUpperCase()}-${randomPart}`;

        // Check if code already exists
        const existing = await prisma.coupon.findUnique({
            where: { code }
        });

        if (!existing) {
            isUnique = true;
            return code;
        }

        attempts++;
    }

    // Fallback: add timestamp if all attempts failed
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix.toUpperCase()}-${timestamp}`;
}

/**
 * Validates coupon code format
 */
export function isValidCouponCodeFormat(code: string): boolean {
    // Format: PREFIX-ALPHANUMERIC (e.g., WELCOME-ABC123)
    const pattern = /^[A-Z0-9]+-[A-Z0-9]{4,}$/;
    return pattern.test(code);
}

/**
 * Generates a user-friendly coupon code based on discount type
 */
export async function generateSmartCouponCode(
    discountType: "FLAT" | "PERCENTAGE",
    discountValue: number
): Promise<string> {
    let prefix = "SAVE";

    if (discountType === "PERCENTAGE") {
        if (discountValue >= 50) {
            prefix = "MEGA";
        } else if (discountValue >= 25) {
            prefix = "SUPER";
        } else {
            prefix = "SAVE";
        }
    } else {
        // FLAT discount
        if (discountValue >= 500) {
            prefix = "MEGA";
        } else if (discountValue >= 200) {
            prefix = "SUPER";
        } else {
            prefix = "SAVE";
        }
    }

    return generateCouponCode(prefix);
}
