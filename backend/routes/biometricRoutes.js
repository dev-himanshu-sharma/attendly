import express from "express";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createRegistrationOptions,
  createAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from "../utils/webauthn.js";

const router = express.Router();

/**
 * GET /biometric/register-options
 * Get registration options for fingerprint enrollment
 */
router.get("/register-options", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.biometricApproved) {
      return res.status(403).json({ message: "Biometric not approved by admin yet" });
    }

    const options = createRegistrationOptions(user);
    
    // Store challenge temporarily (in production, use Redis with TTL)
    user.biometricChallenge = options.challenge;
    await user.save();

    res.json(options);
  } catch (err) {
    console.error("Registration options error:", err);
    res.status(500).json({ message: "Failed to generate registration options", error: err.message });
  }
});

/**
 * POST /biometric/register
 * Register fingerprint credential
 */
router.post("/register", authMiddleware, async (req, res) => {
  try {
    const { response, fingerIndex } = req.body;

    if (!response || !fingerIndex) {
      return res.status(400).json({ message: "Missing response or finger index" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify the registration response
    const credential = await verifyRegistrationResponse(response, user.biometricChallenge);

    // Store credential with finger index
    credential.fingerIndex = fingerIndex; // "thumb", "index", "middle", etc.
    user.biometricCredentials.push(credential);
    user.biometricRegistered = true;
    user.biometricChallenge = undefined; // Clear challenge
    await user.save();

    res.json({
      message: "Fingerprint registered successfully",
      fingerIndex: fingerIndex,
      credentialCount: user.biometricCredentials.length,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(400).json({ message: "Fingerprint registration failed", error: err.message });
  }
});

/**
 * GET /biometric/auth-options
 * Get authentication options for fingerprint verification (login/check-in)
 */
router.get("/auth-options", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.biometricRegistered || user.biometricCredentials.length === 0) {
      return res.status(403).json({ message: "No biometric credentials registered" });
    }

    const options = createAuthenticationOptions(user.biometricCredentials);
    
    // Store challenge temporarily
    user.biometricAuthChallenge = options.challenge;
    await user.save();

    res.json(options);
  } catch (err) {
    console.error("Auth options error:", err);
    res.status(500).json({ message: "Failed to generate auth options", error: err.message });
  }
});

/**
 * POST /biometric/verify
 * Verify fingerprint for login/check-in
 */
router.post("/verify", async (req, res) => {
  try {
    const { email, response } = req.body;

    if (!email || !response) {
      return res.status(400).json({ message: "Email and response required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.biometricRegistered || user.biometricCredentials.length === 0) {
      return res.status(403).json({ message: "No biometric credentials" });
    }

    // Find matching credential
    const credential = user.biometricCredentials.find(
      (cred) => cred.credentialId === response.id
    );

    if (!credential) {
      return res.status(403).json({ message: "Credential not found or not verified" });
    }

    // Verify the authentication response
    const verified = await verifyAuthenticationResponse(
      response,
      credential,
      user.biometricAuthChallenge
    );

    if (!verified.verified) {
      return res.status(403).json({ message: "Biometric verification failed" });
    }

    user.biometricAuthChallenge = undefined; // Clear challenge
    await user.save();

    res.json({
      message: "Biometric verified successfully",
      credentialId: verified.credentialId,
    });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(400).json({ message: "Biometric verification failed", error: err.message });
  }
});

/**
 * GET /biometric/credentials
 * Get registered credentials for current user
 */
router.get("/credentials", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const credentials = user.biometricCredentials.map((cred) => ({
      id: cred.credentialId,
      fingerIndex: cred.fingerIndex,
      createdAt: cred.createdAt,
    }));

    res.json({
      biometricRegistered: user.biometricRegistered,
      credentials: credentials,
    });
  } catch (err) {
    console.error("Credentials error:", err);
    res.status(500).json({ message: "Failed to fetch credentials", error: err.message });
  }
});

/**
 * DELETE /biometric/credentials/:credentialId
 * Remove a registered fingerprint
 */
router.delete("/credentials/:credentialId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const credentialIndex = user.biometricCredentials.findIndex(
      (cred) => cred.credentialId === req.params.credentialId
    );

    if (credentialIndex === -1) {
      return res.status(404).json({ message: "Credential not found" });
    }

    user.biometricCredentials.splice(credentialIndex, 1);

    if (user.biometricCredentials.length === 0) {
      user.biometricRegistered = false;
    }

    await user.save();

    res.json({ message: "Fingerprint removed successfully" });
  } catch (err) {
    console.error("Delete credential error:", err);
    res.status(500).json({ message: "Failed to delete credential", error: err.message });
  }
});

export default router;
