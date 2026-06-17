import { useState, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function BiometricCheckIn() {
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState("idle"); // idle, registering, checking-in, success, error
  const [message, setMessage] = useState("");
  const [fingerIndex, setFingerIndex] = useState("thumb");
  const [credentials, setCredentials] = useState([]);

  const fingers = ["thumb", "index", "middle", "ring", "pinky"];

  // Get WebAuthn registration options
  const startRegistration = async () => {
    try {
      setStatus("registering");
      setMessage("Getting fingerprint registration options...");

      const optionsRes = await API.get("/biometric/register-options");
      const options = optionsRes.data;

      // Decode challenge
      options.challenge = Uint8Array.from(atob(options.challenge), (c) => c.charCodeAt(0));
      options.user.id = Uint8Array.from(atob(options.user.id), (c) => c.charCodeAt(0));

      setMessage("Please place your finger on the biometric scanner or device...");

      // Call WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: options,
      });

      if (!credential) {
        throw new Error("Biometric registration cancelled");
      }

      setMessage("Registering your fingerprint...");

      // Send credential to backend
      const registerRes = await API.post("/biometric/register", {
        response: {
          id: credential.id,
          rawId: credential.id,
          response: {
            attestationObject: credential.response.attestationObject,
            clientDataJSON: credential.response.clientDataJSON,
            transports: credential.response.getTransports?.() || ["internal"],
          },
        },
        fingerIndex: fingerIndex,
      });

      setMessage(
        `✅ ${fingerIndex} fingerprint registered successfully! ${registerRes.data.credentialCount} fingerprint(s) registered.`
      );
      setStatus("success");
      fetchCredentials();

      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("Registration error:", err);
      setStatus("error");
      setMessage(
        `❌ Fingerprint registration failed: ${err.response?.data?.message || err.message}`
      );
    }
  };

  // Get authentication options for check-in
  const startCheckIn = async () => {
    try {
      setStatus("checking-in");
      setMessage("Getting biometric verification options...");

      const optionsRes = await API.get(`/biometric/auth-options?email=${user.email}`);
      const options = optionsRes.data;

      // Decode challenge
      options.challenge = Uint8Array.from(atob(options.challenge), (c) => c.charCodeAt(0));
      options.allowCredentials = options.allowCredentials.map((cred) => ({
        ...cred,
        id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
      }));

      setMessage("Please place your finger on the biometric scanner or device...");

      // Call WebAuthn API
      const assertion = await navigator.credentials.get({
        publicKey: options,
      });

      if (!assertion) {
        throw new Error("Biometric verification cancelled");
      }

      setMessage("Verifying your fingerprint...");

      // Verify with backend
      const verifyRes = await API.post("/biometric/verify", {
        email: user.email,
        response: {
          id: assertion.id,
          rawId: assertion.id,
          response: {
            authenticatorData: assertion.response.authenticatorData,
            clientDataJSON: assertion.response.clientDataJSON,
            signature: assertion.response.signature,
            userHandle: assertion.response.userHandle,
          },
        },
      });

      setMessage("✅ Biometric verified! Checking in...");

      // Now do the actual check-in
      const checkinRes = await API.post("/attendance/", {
        biometricVerified: true,
        credentialId: assertion.id,
      });

      setMessage(`✅ Check-in successful! Status: ${checkinRes.data.attendance.status}`);
      setStatus("success");

      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("Check-in error:", err);
      setStatus("error");
      setMessage(
        `❌ Biometric verification failed: ${err.response?.data?.message || err.message}`
      );
    }
  };

  // Fetch registered credentials
  const fetchCredentials = async () => {
    try {
      const res = await API.get("/biometric/credentials");
      setCredentials(res.data.credentials);
    } catch (err) {
      console.error("Fetch credentials error:", err);
    }
  };

  // Delete credential
  const deleteCredential = async (credentialId) => {
    try {
      await API.delete(`/biometric/credentials/${credentialId}`);
      setMessage("Fingerprint removed successfully");
      fetchCredentials();
    } catch (err) {
      console.error("Delete error:", err);
      setMessage(`Error removing fingerprint: ${err.message}`);
    }
  };

  // Check browser support
  const isWebAuthnSupported = () => {
    return (
      window.PublicKeyCredential !== undefined &&
      navigator.credentials !== undefined
    );
  };

  if (!user || !user.biometricApproved) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700">
          Biometric not enabled. Please request biometric access first.
        </p>
      </div>
    );
  }

  if (!isWebAuthnSupported()) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">
          ⚠️ Your device does not support biometric authentication.
        </p>
        <p className="text-sm text-red-600 mt-2">
          Required: Windows Hello, Touch ID, Face ID, or Android biometric.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Registration Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Register Fingerprint</h3>
        <p className="text-sm text-gray-600 mb-4">
          Register your fingerprints for biometric attendance check-in. You can register up to 5 fingers.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Finger to Register:
            </label>
            <div className="grid grid-cols-5 gap-2">
              {fingers.map((finger) => (
                <button
                  key={finger}
                  onClick={() => setFingerIndex(finger)}
                  className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${
                    fingerIndex === finger
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {finger.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startRegistration}
            disabled={status !== "idle" && status !== "error" && status !== "success"}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
              status !== "idle" && status !== "error" && status !== "success"
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {status === "registering" ? "Registering..." : "Register Fingerprint"}
          </button>
        </div>
      </div>

      {/* Registered Credentials */}
      {credentials.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Registered Fingerprints ({credentials.length})
          </h3>
          <div className="space-y-2">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-800 capitalize">
                    {cred.fingerIndex}
                  </p>
                  <p className="text-xs text-gray-500">
                    Registered: {new Date(cred.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteCredential(cred.id)}
                  className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded text-sm font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Biometric Check-In</h3>
        <p className="text-sm text-gray-600 mb-4">
          Use your registered fingerprint to check in for attendance. Your fingerprint is verified
          and only your attendance will be recorded.
        </p>

        <button
          onClick={startCheckIn}
          disabled={status !== "idle" && status !== "error" && status !== "success" || credentials.length === 0}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
            status !== "idle" && status !== "error" && status !== "success" || credentials.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {status === "checking-in" ? "Verifying..." : "Start Check-In"}
        </button>
        {credentials.length === 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Please register at least one fingerprint first
          </p>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            status === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : status === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          <p className="text-sm">{message}</p>
        </div>
      )}
    </div>
  );
}
