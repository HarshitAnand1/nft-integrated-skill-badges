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

  const handleUsernameCance = () => {
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
      className="min-h-screen flex items-center justify-center p-5"
      style={{
        background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.lightBlue} 50%, ${colors.lightMint} 100%)`,
      }}
    >
      <div
        className="bg-white shadow-2xl p-10 max-w-2xl w-full"
        style={{ borderRadius: "16px", position: "relative", overflow: "hidden" }}
      >
        {/* Welcome Banner for New Users */}
        {showWelcome && (
          <div
            className="absolute top-0 left-0 right-0 p-4 text-white text-center font-semibold animate-fade-in"
            style={{
              background: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.gold} 100%)`,
            }}
          >
            🎉 Welcome to Stellar Skills! Complete your profile below.
          </div>
        )}

        <div style={{ marginTop: showWelcome ? "60px" : "0" }}>
          {/* Logo and Title */}
          <div className="flex items-center justify-center mb-4">
            <div
              className="p-3"
              style={{
                background: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.gold} 100%)`,
                borderRadius: "12px",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" />
              </svg>
            </div>
          </div>
          
          <h1
            className="text-4xl font-bold text-center mb-2"
            style={{
              background: `linear-gradient(135deg, ${colors.darkRed} 0%, ${colors.orange} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Stellar Skills
          </h1>
          <p className="text-center text-gray-600 mb-8 text-base">
            Earn blockchain-verified skill badges
          </p>

          {!account ? (
            <>
              {/* Freighter Status Indicator */}
              <div
                className="p-4 mb-4 transition-all duration-300"
                style={{
                  backgroundColor:
                    freighterStatus === "Detected"
                      ? colors.lightMint
                      : freighterStatus === "Not installed"
                      ? colors.lightPink
                      : colors.lightYellow,
                  borderRadius: "12px",
                  border: `2px solid ${
                    freighterStatus === "Detected"
                      ? "#059669"
                      : freighterStatus === "Not installed"
                      ? colors.rose
                      : colors.gold
                  }`,
                }}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {freighterStatus === "Detected" && "✅"}
                      {freighterStatus === "Not installed" && "❌"}
                      {(freighterStatus === "Checking..." || freighterStatus === "Waiting for extension...") && "⏳"}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      Freighter Wallet
                    </span>
                  </div>
                  <span
                    className="text-sm font-bold"
                    style={{
                      color:
                        freighterStatus === "Detected"
                          ? "#059669"
                          : freighterStatus === "Not installed"
                          ? colors.darkRed
                          : colors.orange,
                    }}
                  >
                    {freighterStatus === "Detected" && "Connected"}
                    {freighterStatus === "Not installed" && "Not Installed"}
                    {freighterStatus === "Checking..." && "Checking..."}
                    {freighterStatus === "Waiting for extension..." && "Loading..."}
                  </span>
                </div>

                {freighterStatus === "Not installed" && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">
                      Please install Freighter to continue
                    </p>
                    <div className="flex gap-2">
                      <a
                        href="https://www.freighter.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center text-sm font-semibold py-2 px-4"
                        style={{
                          backgroundColor: colors.blue,
                          color: "white",
                          borderRadius: "8px",
                          textDecoration: "none",
                        }}
                      >
                        Install Freighter
                      </a>
                      <button
                        onClick={() => {
                          setFreighterStatus("Checking...");
                          checkFreighterStatus();
                        }}
                        className="text-sm font-semibold py-2 px-4"
                        style={{
                          backgroundColor: "white",
                          color: colors.blue,
                          border: `2px solid ${colors.blue}`,
                          borderRadius: "8px",
                        }}
                      >
                        🔄 Recheck
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div
                  className="border-2 p-4 mb-5 flex items-start gap-3 animate-fade-in"
                  style={{
                    backgroundColor: colors.lightPink,
                    borderColor: colors.rose,
                    color: colors.darkRed,
                    borderRadius: "12px",
                  }}
                  role="alert"
                  aria-live="assertive"
                >
                  <span className="text-xl">⚠️</span>
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <button
                className="w-full text-white font-bold py-4 px-6 text-lg shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-6"
                style={{
                  background: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.gold} 100%)`,
                  borderRadius: "12px",
                }}
                onClick={connectWallet}
                disabled={loading || freighterStatus !== "Detected"}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Connecting...
                  </span>
                ) : freighterStatus !== "Detected" ? (
                  "Install Freighter First"
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    🚀 Connect Wallet
                  </span>
                )}
              </button>

              {/* Info Cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div
                  className="text-center p-3"
                  style={{ backgroundColor: colors.lightMint, borderRadius: "10px" }}
                >
                  <div className="text-2xl mb-1">🎓</div>
                  <div className="text-xs font-semibold text-gray-700">Take Tests</div>
                </div>
                <div
                  className="text-center p-3"
                  style={{ backgroundColor: colors.lightYellow, borderRadius: "10px" }}
                >
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-xs font-semibold text-gray-700">Earn Badges</div>
                </div>
                <div
                  className="text-center p-3"
                  style={{ backgroundColor: colors.lightPink, borderRadius: "10px" }}
                >
                  <div className="text-2xl mb-1">⛓️</div>
                  <div className="text-xs font-semibold text-gray-700">NFT Verified</div>
                </div>
              </div>

              <div
                className="border-l-4 p-4"
                style={{
                  backgroundColor: colors.cream,
                  borderColor: colors.gold,
                  color: "#78350f",
                  borderRadius: "8px",
                }}
              >
                <p className="text-sm leading-relaxed m-0">
                  <strong className="text-gray-900">Secure & Decentralized:</strong> Your credentials are stored on the Stellar blockchain and verified via NFTs.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Connected User Profile */}
              <div
                className="mb-6 p-6 animate-fade-in"
                style={{
                  background: `linear-gradient(135deg, ${colors.lightMint} 0%, ${colors.lightBlue} 100%)`,
                  borderRadius: "16px",
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className="shrink-0"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.gold} 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                      fontWeight: "bold",
                      color: "white",
                      border: "4px solid white",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                  >
                    {getInitials(user?.username, account)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    {/* Username Section */}
                    <div className="mb-3">
                      {!isEditingUsername ? (
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-gray-800 m-0">
                            {user?.username || "Anonymous User"}
                          </h2>
                          <button
                            onClick={handleUsernameEdit}
                            className="text-sm px-3 py-1 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
                            title="Edit username"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              placeholder="Enter username"
                              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                              maxLength={20}
                              autoFocus
                            />
                            <button
                              onClick={handleUsernameSave}
                              disabled={isSavingUsername}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
                            >
                              {isSavingUsername ? "..." : "✓"}
                            </button>
                            <button
                              onClick={handleUsernameCance}
                              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                          {usernameError && (
                            <p className="text-sm text-red-600 m-0">{usernameError}</p>
                          )}
                          <p className="text-xs text-gray-600 m-0">
                            3-20 characters, letters, numbers, - and _ only
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Wallet Address */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-gray-700">
                        {formatAddress(account)}
                      </span>
                      <button
                        onClick={copyAddressToClipboard}
                        className="text-xs px-2 py-1 bg-white hover:bg-gray-50 border border-gray-300 rounded transition-colors"
                        aria-label="Copy full wallet address"
                        title="Copy full wallet address"
                      >
                        📋
                      </button>
                      {copySuccess && (
                        <span className="text-xs font-semibold text-green-600 animate-fade-in">
                          {copySuccess}
                        </span>
                      )}
                    </div>

                    {/* Member Since */}
                    {user && (
                      <p className="text-sm text-gray-600 m-0">
                        ⭐ Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-5">
                <button
                  onClick={proceedToDashboard}
                  className="flex-1 text-white font-bold py-4 px-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.gold} 100%)`,
                    borderRadius: "12px",
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    🚀 Go to Dashboard
                  </span>
                </button>
                <button
                  onClick={disconnectWallet}
                  className="px-6 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold border-2 border-gray-300 hover:border-gray-400 rounded-xl transition-all duration-200"
                  title="Disconnect wallet"
                >
                  🚪
                </button>
              </div>

              {/* Quick Stats */}
              {user && (
                <div
                  className="p-4"
                  style={{
                    backgroundColor: colors.cream,
                    borderRadius: "12px",
                  }}
                >
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">User ID</div>
                      <div
                        className="text-sm font-mono font-semibold"
                        style={{ color: colors.blue }}
                      >
                        {user.id.substring(0, 8)}...
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Last Login</div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: colors.blue }}
                      >
                        {new Date(user.last_login).toLocaleDateString()}
                      </div>
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
