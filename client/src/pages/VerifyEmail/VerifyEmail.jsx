// client/src/pages/VerifyEmail/VerifyEmail.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  const searchParams = new URLSearchParams(location.search);

  const messageParam = searchParams.get("message");
  const successParam = searchParams.get("success");
  const codeParam = searchParams.get("code");
  const emailParam = searchParams.get("email"); // optional – from email link

  const isSuccess =
    successParam === "true" ||
    successParam === "1" ||
    codeParam === "success";

  const title = isSuccess ? "Email Verified" : "Email Verification Issue";

  const description =
    messageParam ||
    (isSuccess
      ? "Your email was verified. You can continue using the application."
      : "We could not confirm your email verification. Please try again or contact support.");

  // If user is already authenticated and verification is successful, send them in
  useEffect(() => {
    if (!isLoading && isAuthenticated && isSuccess) {
      navigate("/profile", { replace: true });
    }
  }, [isAuthenticated, isLoading, isSuccess, navigate]);

  const handleLogin = async () => {
    // If already logged in, just go in
    if (isAuthenticated) {
      navigate("/profile");
      return;
    }

    // Kick off Auth0 login
    await loginWithRedirect({
      appState: {
        returnTo: "/profile", // or "/" or wherever you want them after login
      },
      authorizationParams: {
        // If we passed email in the URL, pre-fill the Auth0 login form
        login_hint: emailParam || undefined,
        screen_hint: "login",
      },
    });
  };

  return (
    <div className="min-h-[70vh] w-full bg-white flex items-center">
      <div className="max-w-xl mx-auto px-4 py-10">
        <Card className="shadow-md border-[#e5e7eb]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl text-[#324c48]">
              {isSuccess ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              {title}
            </CardTitle>
            <CardDescription className="text-gray-500">
              {isSuccess
                ? "Thanks for confirming your email address."
                : "Something went wrong while verifying your email."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert
              variant={isSuccess ? "default" : "destructive"}
              className="text-sm"
            >
              <AlertTitle className="font-semibold">
                {isSuccess ? "Success" : "Error"}
              </AlertTitle>
              <AlertDescription>{description}</AlertDescription>
            </Alert>

            {/* Extra instruction about the signup page */}
            {isSuccess && (
              <p className="text-sm text-gray-600">
                You can now log in with your email and password. If you still
                have the signup page open, press its <strong>Continue</strong>{" "}
                button to finish signing in to your account.
              </p>
            )}

            <div className="flex flex-wrap gap-3 justify-between items-center pt-2">
              {/* Left: Back to home */}
              <Button
                variant="outline"
                className="text-[#324c48] border-[#d1d5db]"
                onClick={() => navigate("/")}
              >
                Back
              </Button>

              {/* Right: Login (Auth0) */}
              <Button
                className="bg-[#324c48] hover:bg-[#3f4f24] text-white"
                onClick={handleLogin}
              >
                Log in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
