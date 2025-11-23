import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../config/colors";
import {
  isFreighterInstalled,
  authenticateWithFreighter,
  formatStellarAddress,
} from "../utils/freighter";
import type { User } from "../config/supabase";
import { supabase } from "../config/supabase";

const Login = () => {
  const [account, setAccount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>("");
  const [freighterStatus, setFreighterStatus] = useState<string>("Checking...");
  const navigate = useNavigate();
  const [copySuccess, setCopySuccess] = useState<string>("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    checkIfWalletIsConnected();
    checkFreighterStatus();
  }, []);

  const checkFreighterStatus = async () => {
    console.log("🔍 Checking for Freighter wallet using official API...");

    try {
      // Use the official Freighter API to check connection
      const installed = await isFreighterInstalled();

      if (installed) {
        console.log("✅ Freighter is installed and detected!");
        setFreighterStatus("Detected");
        setError("");
      } else {
        console.log("❌ Freighter not found");
        console.log("");
        console.log("📋 INSTALLATION STEPS:");
        console.log("1. Install Freighter from: https://www.freighter.app/");
        console.log("2. Refresh this page after installation");
        console.log("3. Make sure the extension is enabled in your browser");
        console.log("");
        setFreighterStatus("Not installed");
        setError(
          "Freighter wallet not detected. Please install it from freighter.app"
        );
      }
    } catch (error) {
      console.error("Error checking Freighter status:", error);
      setFreighterStatus("Not installed");
      setError(
        "Error checking Freighter. Please install it from freighter.app"
      );
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const savedUser = localStorage.getItem("stellar_user");
      const savedAddress = localStorage.getItem("stellar_wallet");

      if (savedUser && savedAddress) {
        setAccount(savedAddress);
        setUser(JSON.parse(savedUser));
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Error checking wallet connection:", err);
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError("");

      // Check if Freighter is installed (with wait time)
      const installed = await isFreighterInstalled();
      if (!installed) {
        setError(
          "Please install Freighter wallet to continue. Visit https://www.freighter.app/"
        );
        setLoading(false);
        return;
      }

      // Authenticate with Freighter
      const {
        wallet_address,
        user: userData,
        isNewUser,
      } = await authenticateWithFreighter();

      setAccount(wallet_address);
      setUser(userData);
      setUsername(userData.username || "");

      // Save to localStorage for persistence
      localStorage.setItem("stellar_user", JSON.stringify(userData));
      localStorage.setItem("stellar_wallet", wallet_address);

      // Show welcome message for new users
      if (isNewUser) {
        setShowWelcome(true);
        setTimeout(() => setShowWelcome(false), 5000);
      } else {
        // Redirect existing users to dashboard after a short delay
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err: any) {
      console.error("Error connecting wallet:", err);

      if (err.message.includes("User declined")) {
        setError("Connection request was rejected. Please try again.");
      } else if (err.message.includes("not installed")) {
        setError(
          "Please install Freighter wallet from https://www.freighter.app/"
        );
      } else {
        setError(err.message || "Failed to connect wallet");
      }

      cleanupLoginState();
    } finally {
      setLoading(false);
    }
  };

  const cleanupLoginState = () => {
    setAccount("");
    setUser(null);
    localStorage.removeItem("stellar_user");
    localStorage.removeItem("stellar_wallet");
  };

  const disconnectWallet = () => {
    cleanupLoginState();
  };

  const formatAddress = (address: string) => {
    return formatStellarAddress(address);
  };

  const copyAddressToClipboard = async () => {
    try {
      if (!account) return;
      await navigator.clipboard.writeText(account);
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 1800);
    } catch (err) {
      setCopySuccess("Failed to copy");
    }
  };

  const handleUsernameEdit = () => {
    setIsEditingUsername(true);
    setUsernameError("");
  };

  const handleUsernameSave = async () => {
    if (!user) return;

    const trimmedUsername = username.trim();
    
    // Validation
    if (trimmedUsername.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }
    
    if (trimmedUsername.length > 20) {
      setUsernameError("Username must be less than 20 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setUsernameError("Username can only contain letters, numbers, - and _");
      return;
    }

    try {
      setIsSavingUsername(true);
      setUsernameError("");

      const { data, error } = await supabase
        .from('users')
        .update({ username: trimmedUsername })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      localStorage.setItem("stellar_user", JSON.stringify(data));
      setIsEditingUsername(false);
    } catch (err: any) {
      if (err.code === '23505') {
        setUsernameError("Username already taken");
      } else {
        setUsernameError("Failed to save username");
      }
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleUsernameCancel = () => {
    setUsername(user?.username || "");
    setIsEditingUsername(false);
    setUsernameError("");
  };

  const getInitials = (name?: string, address?: string) => {
    if (name) {
      return name.substring(0, 2).toUpperCase();
    }
    if (address) {
      return address.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  const proceedToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: colors.primary,
      }}
    >
      {/* Main Card */}
      <div
        className="bg-white shadow-xl max-w-md w-full"
        style={{
          borderRadius: "24px",
          overflow: "hidden",
          border: `1px solid ${colors.lightGray}`,
        }}
      >
        {/* Header Section */}
        <div
          className="p-12 text-center"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
          }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center mb-4">
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                background: colors.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill={colors.gold}
                />
              </svg>
            </div>
          </div>

          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: colors.white, letterSpacing: "-0.5px" }}
          >
            Stellar Skills
          </h1>
          <p
            className="text-sm"
            style={{ color: colors.lightGray, opacity: 0.9 }}
          >
            Blockchain-Verified Credentials
          </p>
        </div>

        {/* Content Section */}
        <div className="p-8">
          {!account ? (
            <>
              {/* Wallet Status */}
              <div
                className="mb-6 p-4 flex items-center justify-between"
                style={{
                  backgroundColor: freighterStatus === "Detected" ? colors.offWhite : colors.lightPink,
                  borderRadius: "12px",
                  border: `1px solid ${freighterStatus === "Detected" ? colors.lightGray : colors.error}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: freighterStatus === "Detected" ? colors.success : colors.error,
                    }}
                  />
                  <span className="text-sm font-medium" style={{ color: colors.charcoal }}>
                    Freighter Wallet
                  </span>
                </div>
                <span className="text-xs font-semibold" style={{ color: colors.mediumGray }}>
                  {freighterStatus === "Detected" && "Ready"}
                  {freighterStatus === "Not installed" && "Not Found"}
                  {freighterStatus === "Checking..." && "Checking..."}
                </span>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="mb-6 p-4 animate-fade-in"
                  style={{
                    backgroundColor: colors.lightPink,
                    borderRadius: "12px",
                    borderLeft: `4px solid ${colors.error}`,
                  }}
                  role="alert"
                >
                  <p className="text-sm m-0" style={{ color: colors.error }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Connect Button */}
              <button
                className="w-full font-semibold py-4 text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                style={{
                  background: freighterStatus === "Detected"
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`
                    : colors.mediumGray,
                  color: colors.white,
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: freighterStatus === "Detected" ? "0 4px 12px rgba(26, 26, 46, 0.2)" : "none",
                  transform: loading ? "scale(0.98)" : "scale(1)",
                }}
                onClick={connectWallet}
                disabled={loading || freighterStatus !== "Detected"}
                onMouseOver={(e) => {
                  if (freighterStatus === "Detected" && !loading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(26, 26, 46, 0.3)";
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(26, 26, 46, 0.2)";
                }}
              >
                {loading ? "Connecting..." : freighterStatus !== "Detected" ? "Wallet Not Detected" : "Connect Wallet"}
              </button>

              {/* Install Link */}
              {freighterStatus !== "Detected" && (
                <div className="text-center">
                  <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium inline-flex items-center gap-1"
                    style={{
                      color: colors.primary,
                      textDecoration: "none",
                    }}
                  >
                    Install Freighter Wallet
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>
              )}

              {/* Features */}
              <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${colors.lightGray}` }}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div style={{ color: colors.success, fontSize: "18px" }}>✓</div>
                    <span className="text-sm" style={{ color: colors.slate }}>Secure blockchain authentication</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div style={{ color: colors.success, fontSize: "18px" }}>✓</div>
                    <span className="text-sm" style={{ color: colors.slate }}>NFT-verified credentials</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div style={{ color: colors.success, fontSize: "18px" }}>✓</div>
                    <span className="text-sm" style={{ color: colors.slate }}>Decentralized skill validation</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Welcome Message */}
              {showWelcome && (
                <div
                  className="mb-6 p-4 text-center animate-fade-in"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                    borderRadius: "12px",
                    color: colors.white,
                  }}
                >
                  <p className="text-sm font-medium m-0">Welcome! Set up your profile below.</p>
                </div>
              )}

              {/* Profile Section */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-6">
                  {/* Avatar */}
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: "600",
                      color: colors.white,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(user?.username, account)}
                  </div>

                  {/* Username */}
                  <div className="flex-1">
                    {!isEditingUsername ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2
                            className="text-xl font-semibold m-0"
                            style={{ color: colors.primary }}
                          >
                            {user?.username || "Set Username"}
                          </h2>
                          <button
                            onClick={handleUsernameEdit}
                            className="text-xs px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                            style={{
                              color: colors.mediumGray,
                              border: `1px solid ${colors.lightGray}`,
                              background: "transparent",
                            }}
                          >
                            Edit
                          </button>
                        </div>
                        <p className="text-xs m-0" style={{ color: colors.mediumGray }}>
                          {formatAddress(account)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="username"
                            className="flex-1 px-3 py-2 text-sm rounded-lg"
                            style={{
                              border: `1px solid ${usernameError ? colors.error : colors.lightGray}`,
                              outline: "none",
                            }}
                            maxLength={20}
                            autoFocus
                          />
                          <button
                            onClick={handleUsernameSave}
                            disabled={isSavingUsername}
                            className="px-3 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                            style={{
                              background: colors.success,
                              color: colors.white,
                              border: "none",
                            }}
                          >
                            {isSavingUsername ? "..." : "✓"}
                          </button>
                          <button
                            onClick={handleUsernameCancel}
                            className="px-3 py-2 rounded-lg font-semibold text-sm transition-colors"
                            style={{
                              background: colors.lightGray,
                              color: colors.charcoal,
                              border: "none",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        {usernameError && (
                          <p className="text-xs m-0" style={{ color: colors.error }}>
                            {usernameError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Copy Address */}
                <div
                  className="p-3 flex items-center justify-between"
                  style={{
                    backgroundColor: colors.offWhite,
                    borderRadius: "8px",
                  }}
                >
                  <span className="text-xs font-mono" style={{ color: colors.slate }}>
                    {account}
                  </span>
                  <button
                    onClick={copyAddressToClipboard}
                    className="text-xs px-3 py-1 rounded hover:bg-white transition-colors"
                    style={{
                      color: colors.primary,
                      border: `1px solid ${colors.lightGray}`,
                      background: "transparent",
                    }}
                  >
                    {copySuccess || "Copy"}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                onClick={proceedToDashboard}
                className="w-full font-semibold py-4 text-base transition-all duration-300 mb-3"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                  color: colors.white,
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(26, 26, 46, 0.2)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(26, 26, 46, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(26, 26, 46, 0.2)";
                }}
              >
                Continue to Dashboard
              </button>

              <button
                onClick={disconnectWallet}
                className="w-full font-medium py-3 text-sm transition-colors"
                style={{
                  background: "transparent",
                  color: colors.mediumGray,
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: "12px",
                }}
              >
                Disconnect
              </button>

              {/* Stats */}
              {user && (
                <div
                  className="mt-6 pt-6 flex justify-between text-center"
                  style={{ borderTop: `1px solid ${colors.lightGray}` }}
                >
                  <div>
                    <div className="text-xs mb-1" style={{ color: colors.mediumGray }}>
                      Joined
                    </div>
                    <div className="text-sm font-semibold" style={{ color: colors.charcoal }}>
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ width: "1px", background: colors.lightGray }} />
                  <div>
                    <div className="text-xs mb-1" style={{ color: colors.mediumGray }}>
                      Last Active
                    </div>
                    <div className="text-sm font-semibold" style={{ color: colors.charcoal }}>
                      {new Date(user.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
