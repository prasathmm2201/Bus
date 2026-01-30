import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendSMS } from "@/lib/sms";

export const userService = {
    async registerUser(data: { name: string, email?: string, password?: string, mobile_no?: string }) {
        const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;
        return await (prisma.user as any).create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                mobile_no: data.mobile_no,
                role: "USER"
            }
        });
    },

    async loginUser(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.password) {
            throw new Error("This account is mobile-only. Please login with OTP.");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }

        return user;
    },

    async sendOtp(mobile_no: string) {
        let code = "0000";
        if (process.env.NODE_ENV !== "development") {
            code = Math.floor(1000 + Math.random() * 9000).toString();
        }

        // Save to DB
        const otpModel = (prisma as any).otp || (prisma as any).Otp;
        if (!otpModel) {
            console.error("Prisma models available:", Object.keys(prisma).filter(k => !k.startsWith("_")));
            throw new Error("OTP model not initialized in Prisma client. Please restart the server.");
        }

        await otpModel.create({
            data: {
                mobile_no,
                code,
                expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            }
        });

        // Send SMS
        if (process.env.NODE_ENV !== "development") {
            await sendSMS(mobile_no, code);
        } else {
            console.log(`[DEV] OTP for ${mobile_no}: ${code}`);
        }

        return { success: true };
    },

    async verifyOtp(mobile_no: string, code: string) {
        const otpModel = (prisma as any).otp || (prisma as any).Otp;
        if (!otpModel) {
            throw new Error("OTP model not initialized. Please restart the server.");
        }

        const otpRecord = await otpModel.findFirst({
            where: {
                mobile_no,
                code,
                expires_at: { gt: new Date() }
            },
            orderBy: { created_at: 'desc' }
        });

        if (!otpRecord) {
            throw new Error("Invalid or expired OTP");
        }

        // Delete used/expired OTPs for this number
        await otpModel.deleteMany({
            where: { mobile_no }
        });

        // Upsert user
        let user = await (prisma.user as any).findUnique({
            where: { mobile_no }
        });

        if (!user) {
            user = await (prisma.user as any).create({
                data: {
                    mobile_no,
                    role: "USER",
                    authenticated: true
                }
            });
        }

        return user;
    }
};
