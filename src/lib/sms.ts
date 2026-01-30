
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

export async function sendSMS(mobile_no: string, message: string) {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[SMS DEBUG] To: ${mobile_no}, Message: ${message}`);
        return { success: true, message: "Logged to console in development" };
    }

    if (!FAST2SMS_API_KEY) {
        console.error("FAST2SMS_API_KEY is not defined");
        return { success: false, error: "SMS service not configured" };
    }

    try {
        const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
            method: "POST",
            headers: {
                "authorization": FAST2SMS_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "route": "otp",
                "variables_values": message,
                "numbers": mobile_no,
            })
        });

        const data = await response.json();
        return { success: data.return === true, data };
    } catch (error: any) {
        console.error("Fast2SMS Error:", error);
        return { success: false, error: error.message };
    }
}
