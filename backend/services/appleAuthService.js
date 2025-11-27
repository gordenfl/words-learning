const axios = require("axios");
const jwt = require("jsonwebtoken");
const { jwtVerify, createLocalJWKSet } = require("jose");

// Apple 公钥端点
const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";
const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_AUDIENCE = "com.gordenfl.wordslearning"; // Bundle Identifier

// 缓存 Apple 公钥（避免每次都请求）
let appleKeysCache = null;
let appleKeysCacheTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 小时

/**
 * 获取 Apple 的公钥
 */
async function getApplePublicKeys() {
  // 检查缓存
  if (appleKeysCache && appleKeysCacheTime) {
    const now = Date.now();
    if (now - appleKeysCacheTime < CACHE_DURATION) {
      console.log("📦 Using cached Apple public keys");
      return appleKeysCache;
    }
  }

  try {
    console.log("🔑 Fetching Apple public keys from:", APPLE_KEYS_URL);
    const response = await axios.get(APPLE_KEYS_URL);
    appleKeysCache = response.data;
    appleKeysCacheTime = Date.now();
    console.log("✅ Apple public keys fetched successfully");
    return appleKeysCache;
  } catch (error) {
    console.error("❌ Failed to fetch Apple public keys:", error.message);
    throw new Error("Failed to fetch Apple public keys");
  }
}

/**
 * 从 JWT header 中提取 kid
 */
function getKidFromToken(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
      throw new Error("Invalid token: missing kid in header");
    }
    return decoded.header.kid;
  } catch (error) {
    console.error("❌ Failed to extract kid from token:", error.message);
    throw new Error("Invalid token format");
  }
}

/**
 * 验证 Apple identityToken
 * @param {string} identityToken - Apple 返回的 JWT identity token
 * @returns {Promise<Object>} - 解码后的 token payload
 */
async function verifyIdentityToken(identityToken) {
  if (!identityToken) {
    throw new Error("Identity token is required");
  }

  try {
    console.log("🔍 Verifying Apple identity token...");

    // 1. 解码 token header 获取 kid
    const kid = getKidFromToken(identityToken);
    console.log("📋 Token kid:", kid);

    // 2. 获取 Apple 公钥
    const keysResponse = await getApplePublicKeys();
    const keys = keysResponse.keys;

    // 3. 找到对应的公钥
    const key = keys.find((k) => k.kid === kid);
    if (!key) {
      throw new Error(`Public key not found for kid: ${kid}`);
    }
    console.log("✅ Found matching public key for kid:", kid);

    // 4. 使用 jose 库验证 token
    // jose 库可以直接使用 JWK 验证 JWT，无需转换为 PEM
    const JWKS = createLocalJWKSet({ keys: [key] });
    
    // 支持多个 audience（开发环境和生产环境）
    // Expo 开发环境使用 "host.exp.Exponent"，生产环境使用实际的 Bundle ID
    const allowedAudiences = [
      APPLE_AUDIENCE, // 生产环境: com.gordenfl.wordslearning
      "host.exp.Exponent", // Expo 开发环境
    ];
    
    // 先解码 token 查看实际的 audience
    const decoded = jwt.decode(identityToken, { complete: true });
    const tokenAudience = decoded?.payload?.aud;
    
    console.log("📋 Token audience:", tokenAudience);
    console.log("📋 Allowed audiences:", allowedAudiences);
    
    if (!allowedAudiences.includes(tokenAudience)) {
      throw new Error(
        `Token audience "${tokenAudience}" does not match any allowed audience. ` +
        `Expected one of: ${allowedAudiences.join(", ")}`
      );
    }
    
    // 使用实际的 token audience 进行验证
    const { payload, protectedHeader } = await jwtVerify(
      identityToken,
      JWKS,
      {
        issuer: APPLE_ISSUER,
        audience: tokenAudience, // 使用 token 中的实际 audience
      }
    );

    console.log("✅ Identity token verified successfully");
    console.log("📋 Token payload:", {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      iss: payload.iss,
      aud: payload.aud,
    });

    return {
      userId: payload.sub, // Apple user ID
      email: payload.email || null,
      emailVerified: payload.email_verified || false,
      issuer: payload.iss,
      audience: payload.aud,
      expiration: payload.exp,
      issuedAt: payload.iat,
    };
  } catch (error) {
    console.error("❌ Identity token verification failed:", error.message);
    if (error.code === "ERR_JWT_EXPIRED") {
      throw new Error("Identity token has expired");
    }
    if (error.code === "ERR_JWT_INVALID") {
      throw new Error("Invalid identity token");
    }
    if (error.code === "ERR_JWT_CLAIM_VALIDATION_FAILED") {
      throw new Error(
        `Token validation failed: ${error.claim} - ${error.reason}`
      );
    }
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

module.exports = {
  verifyIdentityToken,
};

