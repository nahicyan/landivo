import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Loader2 } from "lucide-react";

const hasAuthParams = (search) => {
  const params = new URLSearchParams(search);
  return params.has("code") || params.has("state") || params.has("error");
};

export default function AuthCallbackSpinner() {
  const { isLoading } = useAuth0();
  const location = useLocation();

  if (!isLoading || !hasAuthParams(location.search)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-[#324c48]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
