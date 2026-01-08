import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShieldAlert } from "lucide-react";

const AUTH_ERROR_HINTS = [
  "missing transaction",
  "invalid state",
  "state mismatch",
  "login_required",
  "interaction_required",
  "timeout",
  "nonce",
  "token"
];

const isAuthCallbackError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return AUTH_ERROR_HINTS.some((hint) => message.includes(hint));
};

const clearAuthStorage = () => {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("@@auth0spajs@@") || key.includes("auth0")) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("Unable to clear localStorage auth data:", error);
  }

  try {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("@@auth0spajs@@") || key.includes("auth0")) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("Unable to clear sessionStorage auth data:", error);
  }
};

const clearAuthParamsFromUrl = () => {
  try {
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (error) {
    console.warn("Unable to clear auth params from URL:", error);
  }
};

class AuthProviderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    if (isAuthCallbackError(error)) {
      return { hasError: true, error };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Auth provider error caught:", error, errorInfo);
  }

  handleRetry = () => {
    clearAuthStorage();
    clearAuthParamsFromUrl();
    window.location.replace(window.location.pathname);
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-3 text-[#324c48]">
            <Loader2 className="h-7 w-7 animate-spin" />
            <span className="text-sm font-semibold">Restoring your session</span>
          </div>
          <Alert className="border-[#324c48]/20">
            <ShieldAlert className="h-4 w-4 text-[#324c48]" />
            <AlertTitle className="text-[#324c48]">Login could not be completed</AlertTitle>
            <AlertDescription className="text-sm text-gray-600">
              This can happen if the login tab was reopened, the callback timed out, or the
              login state was cleared. Please retry the sign-in flow.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={this.handleRetry} className="bg-[#324c48] text-white">
              Clear Session & Retry
            </Button>
            <Button variant="outline" onClick={this.handleReload}>
              Reload Page
              <RefreshCw className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default AuthProviderErrorBoundary;
