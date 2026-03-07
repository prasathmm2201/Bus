import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding coupons...");

    const existing = await prisma.coupon.findUnique({ where: { code: "WELCOME50" } });
    if (!existing) {
        await prisma.coupon.create({
            data: {
                code: "WELCOME50",
                description: "Get 50% off on your first booking",
                discount_type: "PERCENTAGE",
                discount_value: 50,
                max_discount: 200,
                min_order_value: 300,
                valid_from: new Date(),
                valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                user_limit: 1,
                is_active: true
            }
        });
        console.log("Created coupon: WELCOME50");
    } else {
        console.log("Coupon WELCOME50 already exists");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
