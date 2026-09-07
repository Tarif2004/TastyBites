import axios from "axios";

/**
 * Normalizes Indian phone numbers into consistent formats.
 * Accepts: "9876543210", "+919876543210", "919876543210", "09876543210", "+91 98765-43210"
 * 
 * Returns:
 * {
 *   isValid: boolean,
 *   raw10: "9876543210",           // Format required by Fast2SMS
 *   formattedE164: "+919876543210" // Normalized DB representation
 * }
 */
export const normalizeIndianPhoneNumber = (phoneInput) => {
  if (!phoneInput) {
    return { isValid: false, raw10: null, formattedE164: null };
  }

  // Strip all non-digit characters
  const digitsOnly = String(phoneInput).replace(/\D/g, "");

  let tenDigits = "";

  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    tenDigits = digitsOnly.slice(2);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    tenDigits = digitsOnly.slice(1);
  } else if (digitsOnly.length === 10) {
    tenDigits = digitsOnly;
  }

  // Validate standard 10-digit Indian mobile numbers (starting with 6, 7, 8, 9)
  const isValid = /^[6-9]\d{9}$/.test(tenDigits);

  return {
    isValid,
    raw10: isValid ? tenDigits : null,
    formattedE164: isValid ? `+91${tenDigits}` : null,
  };
};

/**
 * Sends OTP via Fast2SMS official Bulk V2 API.
 * 
 * Endpoint: POST https://www.fast2sms.com/dev/bulkV2
 * Headers: authorization: <FAST2SMS_API_KEY>, Content-Type: application/json
 * 
 * @param {string} phone - Target mobile number
 * @param {string} otp - Cryptographically generated OTP code
 * @returns {Promise<{ success: boolean, message: string, requestId?: string, demoMode?: boolean }>}
 */
export const sendOTP = async (phone, otp) => {
  const { isValid, raw10, formattedE164 } = normalizeIndianPhoneNumber(phone);

  if (!isValid || !raw10) {
    return {
      success: false,
      message: "Please enter a valid 10-digit Indian mobile number.",
    };
  }

  const apiKey = process.env.FAST2SMS_API_KEY;
  const isKeyMissingOrPlaceholder =
    !apiKey ||
    apiKey === "your_fast2sms_api_key_here" ||
    apiKey.trim().length < 8;

  // Development fallback when no Fast2SMS API key is set
  if (isKeyMissingOrPlaceholder) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Fast2SMS-Dev] (No API key set) Simulated SMS to ${formattedE164}: ${otp}`);
      return {
        success: true,
        message: `Verification code sent to ${formattedE164.slice(0, 5)}XXXXXX${formattedE164.slice(-2)}`,
        demoMode: true,
      };
    }

    console.error("[Fast2SMS] CRITICAL: FAST2SMS_API_KEY environment variable is not configured.");
    return {
      success: false,
      message: "SMS service is temporarily unavailable. Please try again later.",
    };
  }

  const masked = `${formattedE164.slice(0, 5)}XXXXXX${formattedE164.slice(-2)}`;
  const apiUrl = "https://www.fast2sms.com/dev/bulkV2";

  // Step 1: Attempt standard Fast2SMS OTP route
  try {
    const otpResponse = await axios.post(
      apiUrl,
      {
        route: "otp",
        variables_values: String(otp),
        numbers: raw10,
      },
      {
        headers: {
          authorization: apiKey.trim(),
          "Content-Type": "application/json",
          accept: "application/json",
        },
        timeout: 9000,
      }
    );

    const data = otpResponse.data;

    if (data && data.return === true) {
      console.log(`[Fast2SMS] OTP sent via 'otp' route to ${masked} (Request ID: ${data.request_id})`);
      return {
        success: true,
        message: `Verification code sent to ${masked}`,
        requestId: data.request_id,
        demoMode: false,
      };
    }

    // If route 'otp' returned return: false, log and attempt quick SMS route
    console.warn(`[Fast2SMS] 'otp' route unsuccessful:`, data?.message, "— Trying 'q' route fallback...");
  } catch (otpErr) {
    console.warn(`[Fast2SMS] 'otp' route request failed:`, otpErr.response?.data?.message || otpErr.message, "— Trying 'q' route fallback...");
  }

  // Step 2: Fallback to Fast2SMS Quick SMS ('q') route
  try {
    const qResponse = await axios.post(
      apiUrl,
      {
        route: "q",
        message: `Your TastyBites verification code is ${otp}. Valid for 5 minutes. Do not share this code.`,
        language: "english",
        flash: 0,
        numbers: raw10,
      },
      {
        headers: {
          authorization: apiKey.trim(),
          "Content-Type": "application/json",
          accept: "application/json",
        },
        timeout: 9000,
      }
    );

    const qData = qResponse.data;

    if (qData && qData.return === true) {
      console.log(`[Fast2SMS] OTP sent via 'q' route to ${masked} (Request ID: ${qData.request_id})`);
      return {
        success: true,
        message: `Verification code sent to ${masked}`,
        requestId: qData.request_id,
        demoMode: false,
      };
    }

    const serverErr = Array.isArray(qData?.message)
      ? qData.message.join(", ")
      : String(qData?.message || "Fast2SMS rejected request");

    console.error(`[Fast2SMS] Delivery failed: ${serverErr}`);

    return {
      success: false,
      message: "Failed to deliver verification code. Please check your mobile number and try again.",
    };
  } catch (qErr) {
    const errorDetails = qErr.response?.data?.message || qErr.message;
    console.error(`[Fast2SMS] Network/API Error:`, errorDetails);

    return {
      success: false,
      message: "Unable to send verification SMS at this moment. Please try again.",
    };
  }
};

export default {
  normalizeIndianPhoneNumber,
  sendOTP,
};
