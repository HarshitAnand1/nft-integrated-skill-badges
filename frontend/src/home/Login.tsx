import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../config/colors";
import {
  isFreighterInstalled,
  authenticateWithFreighter,
  formatStellarAddress,
} from "../utils/freighter";
import type { User } from "../config/supabase";

const Login = () => {
  const [account, setAccount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>("");
  const [freighterStatus, setFreighterStatus] = useState<string>("Checking...");
  const navigate = useNavigate();
  const [copySuccess, setCopySuccess] = useState<string>("");

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

      // Save to localStorage for persistence
      localStorage.setItem("stellar_user", JSON.stringify(userData));
      localStorage.setItem("stellar_wallet", wallet_address);

      // Redirect to dashboard
      navigate("/dashboard");
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

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.lightBlue} 50%, ${colors.lightMint} 100%)`,
      }}
    >
      {/* Pixelated Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Left Pixel Cluster */}
        <div className="absolute top-10 left-10 grid grid-cols-3 gap-2 opacity-30">
          <div className="w-6 h-6" style={{ backgroundColor: colors.lightMint }}></div>
          <div className="w-6 h-6" style={{ backgroundColor: colors.lightBlue }}></div>
          <div className="w-6 h-6" style={{ backgroundColor: colors.cream }}></div>
          <div className="w-6 h-6" style={{ backgroundColor: colors.lightYellow }}></div>
          <div className="w-6 h-6" style={{ backgroundColor: colors.peach }}></div>
          <div className="w-6 h-6" style={{ backgroundColor: colors.lightMint }}></div>
        </div>
        
        {/* Bottom Right Pixel Cluster */}
        <div className="absolute bottom-10 right-10 grid grid-cols-4 gap-2 opacity-30">
          <div className="w-5 h-5" style={{ backgroundColor: colors.gold }}></div>
          <div className="w-5 h-5" style={{ backgroundColor: colors.orange }}></div>
          <div className="w-5 h-5" style={{ backgroundColor: colors.peach }}></div>
          <div className="w-5 h-5" style={{ backgroundColor: colors.lightYellow }}></div>
          <div className="w-5 h-5" style={{ backgroundColor: colors.cream }}></div>
          <div className="w-5 h-5" style={{ backgroundColor: colors.gold }}></div>
          <div className="w-5 h-5" style={{ backgroundColor: colors.orange }}></div>
          <div className="w-5 h-5" style={{ backgroundColor: colors.lightBlue }}></div>
        </div>
        
        {/* Top Right Scattered Pixels */}
        <div className="absolute top-32 right-24 grid grid-cols-2 gap-3 opacity-25">
          <div className="w-7 h-7" style={{ backgroundColor: colors.pink }}></div>
          <div className="w-7 h-7" style={{ backgroundColor: colors.lightPink }}></div>
          <div className="w-7 h-7" style={{ backgroundColor: colors.rose }}></div>
          <div className="w-7 h-7" style={{ backgroundColor: colors.peach }}></div>
        </div>
      </div>

      <div
        className="bg-white shadow-2xl p-10 max-w-lg w-full animate-fade-in relative z-10"
        style={{ borderRadius: "12px" }}
      >
        {/* Pixelated Logo Icon */}
        <div className="flex items-center justify-center mb-6">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            {/* Pixel art star/badge shape */}
            <rect x="24" y="8" width="8" height="8" fill={colors.gold} />
            <rect x="32" y="8" width="8" height="8" fill={colors.gold} />
            
            <rect x="16" y="16" width="8" height="8" fill={colors.orange} />
            <rect x="24" y="16" width="8" height="8" fill={colors.lightYellow} />
            <rect x="32" y="16" width="8" height="8" fill={colors.lightYellow} />
            <rect x="40" y="16" width="8" height="8" fill={colors.orange} />
            
            <rect x="8" y="24" width="8" height="8" fill={colors.orange} />
            <rect x="16" y="24" width="8" height="8" fill={colors.gold} />
            <rect x="24" y="24" width="8" height="8" fill={colors.cream} />
            <rect x="32" y="24" width="8" height="8" fill={colors.cream} />
            <rect x="40" y="24" width="8" height="8" fill={colors.gold} />
            <rect x="48" y="24" width="8" height="8" fill={colors.orange} />
            
            <rect x="8" y="32" width="8" height="8" fill={colors.orange} />
            <rect x="16" y="32" width="8" height="8" fill={colors.gold} />
            <rect x="24" y="32" width="8" height="8" fill={colors.cream} />
            <rect x="32" y="32" width="8" height="8" fill={colors.cream} />
            <rect x="40" y="32" width="8" height="8" fill={colors.gold} />
            <rect x="48" y="32" width="8" height="8" fill={colors.orange} />
            
            <rect x="16" y="40" width="8" height="8" fill={colors.orange} />
            <rect x="24" y="40" width="8" height="8" fill={colors.gold} />
            <rect x="32" y="40" width="8" height="8" fill={colors.gold} />
            <rect x="40" y="40" width="8" height="8" fill={colors.orange} />
            
            <rect x="24" y="48" width="8" height="8" fill={colors.gold} />
            <rect x="32" y="48" width="8" height="8" fill={colors.gold} />
          </svg>
        </div>
        
        <h1
          className="text-4xl font-bold text-center mb-3"
          style={{ 
            color: colors.darkRed,
            textShadow: `2px 2px 0px ${colors.rose}40`
          }}
        >
          Stellar Skills
        </h1>
        <p 
          className="text-center mb-8 text-base"
          style={{ color: colors.blue }}
        >
          Connect your Freighter wallet to get started
        </p>

        {/* Freighter Status Indicator */}
        <div
          className="p-4 mb-5 relative overflow-hidden"
          style={{
            backgroundColor:
              freighterStatus === "Detected"
                ? colors.lightMint
                : freighterStatus === "Not installed"
                ? colors.lightPink
                : colors.lightYellow,
            borderRadius: "8px",
          }}
          role="status"
          aria-live="polite"
        >
          {/* Pixel decoration in corner */}
          <div className="absolute top-0 right-0 grid grid-cols-2 gap-1 opacity-20">
            <div className="w-3 h-3" style={{ 
              backgroundColor: freighterStatus === "Detected" ? colors.blue : colors.orange 
            }}></div>
            <div className="w-3 h-3" style={{ 
              backgroundColor: freighterStatus === "Detected" ? colors.lightBlue : colors.gold 
            }}></div>
            <div className="w-3 h-3" style={{ 
              backgroundColor: freighterStatus === "Detected" ? colors.lightBlue : colors.gold 
            }}></div>
            <div className="w-3 h-3" style={{ 
              backgroundColor: freighterStatus === "Detected" ? colors.blue : colors.orange 
            }}></div>
          </div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-sm font-semibold" style={{ color: colors.darkRed }}>
              Freighter Wallet
            </span>
            <span
              className="text-sm font-bold px-3 py-1 rounded"
              style={{
                backgroundColor: "white",
                color:
                  freighterStatus === "Detected"
                    ? colors.blue
                    : freighterStatus === "Not installed"
                    ? colors.darkRed
                    : colors.orange,
              }}
            >
              {freighterStatus === "Detected" && "Detected"}
              {freighterStatus === "Not installed" && "Not Installed"}
              {freighterStatus === "Checking..." && "Checking..."}
              {freighterStatus === "Waiting for extension..." && "Loading..."}
            </span>
          </div>

          {freighterStatus === "Not installed" && (
            <button
              onClick={() => {
                setFreighterStatus("Checking...");
                checkFreighterStatus();
              }}
              className="w-full text-sm font-semibold py-2 px-4 mt-2 transition-all duration-200 hover:opacity-90 relative z-10"
              style={{
                backgroundColor: colors.blue,
                color: "white",
                borderRadius: "6px",
                border: "none",
              }}
            >
              Re-check for Freighter
            </button>
          )}
        </div>

        {error && (
          <div
            className="p-4 mb-5 relative overflow-hidden"
            style={{
              backgroundColor: colors.lightPink,
              color: colors.darkRed,
              borderRadius: "8px",
            }}
            role="alert"
            aria-live="assertive"
          >
            {/* Pixel decoration */}
            <div className="absolute bottom-0 left-0 grid grid-cols-3 gap-1 opacity-15">
              <div className="w-3 h-3" style={{ backgroundColor: colors.rose }}></div>
              <div className="w-3 h-3" style={{ backgroundColor: colors.pink }}></div>
              <div className="w-3 h-3" style={{ backgroundColor: colors.rose }}></div>
            </div>
            <span className="relative z-10 font-medium">{error}</span>
          </div>
        )}

        {!account ? (
          <button
            className="w-full text-white font-bold py-4 px-6 text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mb-6 relative overflow-hidden group"
            style={{
              background: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.gold} 100%)`,
              borderRadius: "8px",
              border: "none",
            }}
            onClick={connectWallet}
            disabled={loading || freighterStatus !== "Detected"}
          >
            {/* Pixel hover effect */}
            <div className="absolute inset-0 grid grid-cols-8 gap-1 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="w-full h-full" style={{ backgroundColor: colors.lightYellow }}></div>
              ))}
            </div>
            <span className="relative z-10">
              {loading
                ? "Connecting..."
                : freighterStatus !== "Detected"
                ? "Install Freighter First"
                : "Connect Wallet"}
            </span>
          </button>
        ) : (
          <div className="mb-6">
            <div
              className="p-5 mb-5 relative overflow-hidden"
              style={{ 
                backgroundColor: colors.cream, 
                borderRadius: "8px"
              }}
            >
              {/* Decorative pixels in corner */}
              <div className="absolute top-2 left-2 grid grid-cols-2 gap-1 opacity-20">
                <div className="w-2 h-2" style={{ backgroundColor: colors.gold }}></div>
                <div className="w-2 h-2" style={{ backgroundColor: colors.orange }}></div>
                <div className="w-2 h-2" style={{ backgroundColor: colors.orange }}></div>
                <div className="w-2 h-2" style={{ backgroundColor: colors.gold }}></div>
              </div>
              
              <div className="flex justify-between py-2.5 border-b relative z-10" style={{ borderColor: colors.peach }}>
                <span className="font-semibold" style={{ color: colors.darkRed }}>
                  Connected Wallet
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className="font-mono text-sm"
                    style={{ color: colors.blue }}
                  >
                    {formatAddress(account)}
                  </span>
                  <button
                    onClick={copyAddressToClipboard}
                    className="text-xs px-3 py-1 font-semibold rounded transition-all duration-200 hover:opacity-80"
                    style={{
                      backgroundColor: colors.lightBlue,
                      color: colors.blue,
                      border: "none",
                    }}
                    aria-label="Copy full wallet address"
                    title="Copy full wallet address"
                  >
                    Copy
                  </button>
                  {copySuccess && (
                    <span className="text-xs font-semibold" style={{ color: colors.blue }}>
                      {copySuccess}
                    </span>
                  )}
                </div>
              </div>
              {user && (
                <>
                  <div className="flex justify-between py-2.5 border-b relative z-10" style={{ borderColor: colors.peach }}>
                    <span className="font-semibold" style={{ color: colors.darkRed }}>
                      User ID
                    </span>
                    <span
                      className="font-mono text-sm"
                      style={{ color: colors.blue }}
                    >
                      {user.id}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b relative z-10" style={{ borderColor: colors.peach }}>
                    <span className="font-semibold" style={{ color: colors.darkRed }}>Joined</span>
                    <span
                      className="font-mono text-sm"
                      style={{ color: colors.blue }}
                    >
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5 relative z-10">
                    <span className="font-semibold" style={{ color: colors.darkRed }}>
                      Last Login
                    </span>
                    <span
                      className="font-mono text-sm"
                      style={{ color: colors.blue }}
                    >
                      {new Date(user.last_login).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
            <button
              className="w-full font-semibold py-4 px-6 transition-all duration-200 hover:opacity-80"
              style={{ 
                backgroundColor: colors.lightPink,
                color: colors.darkRed,
                borderRadius: "8px",
                border: "none",
              }}
              onClick={disconnectWallet}
            >
              Disconnect
            </button>
          </div>
        )}

        <div
          className="p-4 relative overflow-hidden"
          style={{
            backgroundColor: colors.lightYellow,
            borderRadius: "8px",
          }}
        >
          {/* Decorative pixel pattern */}
          <div className="absolute bottom-0 right-0 grid grid-cols-3 gap-1 opacity-15">
            <div className="w-3 h-3" style={{ backgroundColor: colors.gold }}></div>
            <div className="w-3 h-3" style={{ backgroundColor: colors.orange }}></div>
            <div className="w-3 h-3" style={{ backgroundColor: colors.gold }}></div>
            <div className="w-3 h-3" style={{ backgroundColor: colors.orange }}></div>
            <div className="w-3 h-3" style={{ backgroundColor: colors.gold }}></div>
            <div className="w-3 h-3" style={{ backgroundColor: colors.orange }}></div>
          </div>
          
          <p className="m-0 leading-relaxed relative z-10" style={{ color: colors.darkRed }}>
            <strong>Note:</strong> Make sure you have
            Freighter wallet extension installed in your browser. Download from{" "}
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:opacity-80 transition-opacity"
              style={{ color: colors.blue, textDecoration: "underline" }}
            >
              freighter.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
