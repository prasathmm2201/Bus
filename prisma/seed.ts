import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeder reference: Seeding already completed via SQL.");

    // Example logic for future use
    const adminEmail = "admin@srirambus.com";
    const adminPassword = await bcrypt.hash("admin@123", 10);

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            name: "Sriram Admin",
            email: adminEmail,
            password: adminPassword,
            role: Role.ADMIN,
        },
    });
    // Seed Cities and Boarding Points
    const citiesData = [
        { name: "Bangalore", state: "Karnataka", points: ["Majestic", "Silk Board", "Electronic City", "Kalasipalyam"] },
        { name: "Chennai", state: "Tamil Nadu", points: ["Koyambedu", "Tambaram", "Guindy", "T Nagar"] },
        { name: "Hyderabad", state: "Telangana", points: ["MGBS", "Gachibowli", "Ameerpet", "Kukatpally"] },
        { name: "Mumbai", state: "Maharashtra", points: ["Vashi", "Andheri", "Borivali", "Dadar"] },
        { name: "Pune", state: "Maharashtra", points: ["Swargate", "Wakad", "Hinjewadi", "Viman Nagar"] },
        { name: "Coimbatore", state: "Tamil Nadu", points: ["Gandhipuram", "Omni Bus Stand", "Ukkadam"] },
        { name: "Madurai", state: "Tamil Nadu", points: ["Mattuthavani", "Periyar Bus Stand", "Arapalayam"] },
        { name: "Trichy", state: "Tamil Nadu", points: ["Central Bus Stand", "Chatram Bus Stand"] },
        { name: "Salem", state: "Tamil Nadu", points: ["New Bus Stand", "Old Bus Stand"] },
        { name: "Viluppuram", state: "Tamil Nadu", points: ["New Bus Stand", "Bypass"] },
        { name: "Dindigul", state: "Tamil Nadu", points: ["Bus Stand", "Bypass"] },
    ];

    for (const cityData of citiesData) {
        // Upsert city
        const city = await prisma.city.upsert({
            where: { name: cityData.name },
            update: { state: cityData.state },
            create: { name: cityData.name, state: cityData.state }
        });

        // Upsert points for this city
        for (const pointName of cityData.points) {
            await prisma.boardingPoint.upsert({
                where: {
                    name_city_id: {
                        name: pointName,
                        city_id: city.id
                    }
                },
                update: {},
                create: {
                    name: pointName,
                    city_id: city.id
                }
            });
        }
    }
    console.log("Seeded Cities and Boarding Points");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
