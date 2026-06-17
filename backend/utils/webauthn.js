import crypto from "crypto";

/**
 * Generate a random challenge for WebAuthn operations
 */
export const generateChallenge = () => {
  return crypto.randomBytes(32).toString("base64");
};

/**
 * Create WebAuthn registration options
 */
export const createRegistrationOptions = (user) => {
  return {
    challenge: generateChallenge(),
    rp: {
      name: "Attendance App",
      id: process.env.WEBAUTHN_RP_ID || "localhost",
    },
    user: {
      id: Buffer.from(user._id.toString()).toString("base64"),
      name: user.email,
      displayName: user.name || user.email,
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" }, // ES256
      { alg: -257, type: "public-key" }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // Built-in (fingerprint, face, PIN)
      userVerification: "preferred",
    },
    timeout: 60000,
    attestation: "direct",
  };
};

/**
 * Create WebAuthn authentication/verification options
 */
export const createAuthenticationOptions = (credentials) => {
  return {
    challenge: generateChallenge(),
    timeout: 60000,
    userVerification: "preferred",
    allowCredentials: credentials.map((cred) => ({
      id: cred.credentialId,
      type: "public-key",
      transports: cred.transports || ["internal"], // fingerprint, face, PIN
    })),
  };
};

/**
 * Verify registration response (simplified - in production use @simplewebauthn/server)
 * This is a basic implementation. For production, use proper library.
 */
export const verifyRegistrationResponse = async (response, challenge) => {
  try {
    // In production, use @simplewebauthn/server for full verification
    // This is a simplified version that trusts the response
    
    if (!response.id || !response.rawId || !response.response) {
      throw new Error("Invalid response format");
    }

    const credential = {
      credentialId: response.id,
      publicKey: Buffer.from(response.response.attestationObject),
      counter: 0,
      transports: response.response.transports || ["internal"],
    };

    return credential;
  } catch (err) {
    throw new Error(`Registration verification failed: ${err.message}`);
  }
};

/**
 * Verify authentication response (simplified)
 */
export const verifyAuthenticationResponse = async (
  response,
  storedCredential,
  challenge
) => {
  try {
    if (!response.id || !response.rawId) {
      throw new Error("Invalid authentication response");
    }

    // Check if credential ID matches
    if (response.id !== storedCredential.credentialId) {
      throw new Error("Credential ID mismatch");
    }

    // In production, verify the signature using the stored public key
    // This is a simplified version
    
    return {
      verified: true,
      credentialId: response.id,
    };
  } catch (err) {
    throw new Error(`Authentication verification failed: ${err.message}`);
  }
};
