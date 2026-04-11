"use client";

import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoaderCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import {
  LoginBody,
  LoginBodyType,
  RegisterBody,
  RegisterBodyType,
} from "@/schemaValidations/auth.schema";
import { useLoginMutation, useRegisterMutation } from "@/queries/useAuth";
import { useAppContext } from "@/components/app-provider";
import Image from "next/image";
import authApiRequest from "@/apiRequests/auth";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "login" | "register";

const CAROUSEL_IMAGES = [
  "/hero/new-login-image-1.png",
  "/hero/new-login-image-2.png",
  "/hero/new-login-image-3.png",
  "/hero/new-login-image-4.png",
  "/hero/new-login-image-5.png",
];

const CAROUSEL_INTERVAL = 5000;

const carouselVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    scale: 1.04,
    x: dir > 0 ? 60 : -60,
  }),
  center: {
    opacity: 1,
    scale: 1,
    x: 0,
  },
  exit: (dir: number) => ({
    opacity: 0,
    scale: 0.98,
    x: dir > 0 ? -60 : 60,
  }),
};

const INPUT_CLASS =
  "w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200";

const formVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

export default function AuthForm({
  initialMode = "login",
}: {
  initialMode?: AuthMode;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [direction, setDirection] = useState(0);

  const tLogin = useTranslations("Login");
  const tRegister = useTranslations("Register");
  const errorMessageT = useTranslations("ValidationErrors");

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const { setIsAuth, setRole } = useAppContext();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Image Carousel ──
  const [currentImage, setCurrentImage] = useState(0);
  const [carouselDirection, setCarouselDirection] = useState(1);

  const goToImage = useCallback(
    (index: number) => {
      setCarouselDirection(index > currentImage ? 1 : -1);
      setCurrentImage(index);
    },
    [currentImage]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselDirection(1);
      setCurrentImage((prev) =>
        prev === CAROUSEL_IMAGES.length - 1 ? 0 : prev + 1
      );
    }, CAROUSEL_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const isLogin = mode === "login";
  const t = isLogin ? tLogin : tRegister;
  const isPending = isLogin
    ? loginMutation.isPending
    : registerMutation.isPending;

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      localStorage.removeItem("userInfo");
      setIsAuth(false);
      setRole(null);
    }
  }, [setIsAuth, setRole]);

  // ── Login form ──
  const loginForm = useForm<LoginBodyType>({
    resolver: zodResolver(LoginBody),
    defaultValues: { email: "", password: "" },
  });

  // ── Register form ──
  const registerForm = useForm<RegisterBodyType>({
    resolver: zodResolver(RegisterBody),
    defaultValues: { email: "", username: "", password: "", confirmPassword: "" },
  });

  const switchMode = (newMode: AuthMode) => {
    if (newMode === mode) return;
    setDirection(newMode === "register" ? 1 : -1);
    setShowPassword(false);
    setShowConfirmPassword(false);

    // Transfer email between forms
    if (newMode === "register") {
      const email = loginForm.getValues("email");
      if (email) registerForm.setValue("email", email);
    } else {
      const email = registerForm.getValues("email");
      if (email) loginForm.setValue("email", email);
    }

    setMode(newMode);
    // Sync URL without full page reload
    router.replace(newMode === "login" ? "/login" : "/register", {
      scroll: false,
    });
  };

  // ── Login submit ──
  const onLoginSubmit = async (data: LoginBodyType) => {
    if (loginMutation.isPending) return;
    try {
      const result = await loginMutation.mutateAsync(data);

      if (!result.payload.success) {
        toast({
          variant: "destructive",
          title: tLogin("loginError") || "Login Failed",
          description: result.payload.message || tLogin("loginErrorMessage"),
        });
        return;
      }

      const userStatus = result.payload.data.user.status;
      if (userStatus === "INACTIVE" || userStatus === "PENDING") {
        toast({
          variant: "destructive",
          title: tLogin("accountNotActive") || "Account Not Active",
          description: tLogin("VerificationRequired"),
        });
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      localStorage.setItem("accessToken", result.payload.data.accessToken);
      localStorage.setItem("refreshToken", result.payload.data.refreshToken);
      await authApiRequest.setTokenToCookie({
        accessToken: result.payload.data.accessToken,
        refreshToken: result.payload.data.refreshToken,
      });
      localStorage.setItem(
        "userInfo",
        JSON.stringify(result.payload.data.user)
      );

      const userRole = result.payload.data.user.roles[0] || "USER";
      setIsAuth(true);
      setRole(userRole);

      toast({
        title: tLogin("loginSuccess") || "Login Successful",
        description:
          result.payload.message ||
          `Welcome ${result.payload.data.user.username}!`,
      });

      if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
        router.push("/manage/accounts");
      } else if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: tLogin("loginError") || "Login Failed",
        description:
          error.message || error.payload?.message || tLogin("loginErrorMessage"),
      });
    }
  };

  // ── Register submit ──
  const onRegisterSubmit = async (data: RegisterBodyType) => {
    if (registerMutation.isPending) return;
    try {
      const result = await registerMutation.mutateAsync(data);

      toast({
        title: tRegister("registerSuccess"),
        description: tRegister("registerSuccessMessage"),
      });
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: tRegister("registerError"),
        description: error.message || tRegister("registerErrorMessage"),
      });
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex overflow-hidden bg-white dark:bg-gray-950">
      {/* ── Left Panel: Brand Image ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-800 to-indigo-900 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
        {/* Decorative blur orbs */}
        <div className="absolute top-[-60px] left-[-60px] w-96 h-96 rounded-full bg-blue-300/15 dark:bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[100px] right-[-40px] w-72 h-72 rounded-full bg-indigo-300/15 dark:bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-cyan-400/10 dark:bg-cyan-500/8 blur-2xl pointer-events-none" />

        {/* TechHub brand mark */}
        <div className="relative px-10 pt-8 flex-shrink-0">
          <span className="text-white font-bold text-xl tracking-tight">
            Tech<span className="text-blue-300 dark:text-blue-400">Hub</span>
          </span>
        </div>

        {/* Image Carousel */}
        <div className="flex-1 flex items-center justify-center px-10 py-6">
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/50 dark:shadow-black/70 ring-1 ring-white/10 dark:ring-white/5 dark:border dark:border-white/8">
            <AnimatePresence initial={false} custom={carouselDirection}>
              <motion.div
                key={currentImage}
                custom={carouselDirection}
                variants={carouselVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={CAROUSEL_IMAGES[currentImage]}
                  alt={`TechHub learning ${currentImage + 1}`}
                  fill
                  className="object-cover object-center dark:brightness-75 dark:saturate-75"
                  priority={currentImage === 0}
                />
              </motion.div>
            </AnimatePresence>
            {/* Vignette */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/30 via-transparent to-transparent dark:from-black/60 dark:via-black/10 dark:to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative px-10 pb-10 flex-shrink-0">
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-5 ring-1 ring-white/10 dark:ring-white/8">
            <svg
              className="w-6 h-6 text-blue-300 mb-2 opacity-80"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <p className="text-white/90 text-sm font-medium leading-relaxed mb-3">
              TechHub has transformed the way I learn! The courses are
              well-structured, engaging, and easy to follow. Highly recommend it
              for anyone looking to upskill!
            </p>
            <div className="flex items-center justify-between">
              <footer className="text-xs text-white/60 font-medium">
                Samin &mdash; Graphic Designer
              </footer>
              {/* <div className="flex items-center gap-1.5">
                <span className="w-4 h-1 rounded-full bg-white/80" />
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="w-1 h-1 rounded-full bg-white/30" />
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="w-full lg:w-[48%] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-8 sm:px-14 overflow-y-auto">
        <div className="w-full max-w-[420px] py-6">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-6">
            <span className="text-gray-900 dark:text-white font-bold text-xl tracking-tight">
              Tech<span className="text-blue-500">Hub</span>
            </span>
          </div>

          {/* Heading — animates with mode */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={mode + "-heading"}
              custom={direction}
              variants={formVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="mb-5"
            >
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-1">
                {isLogin ? tLogin("title") : tRegister("title")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLogin ? tLogin("description") : tRegister("description")}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Tab toggle */}
          <div className="flex bg-gray-200 dark:bg-gray-800 rounded-xl p-1 mb-5 relative">
            {/* Sliding indicator */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-lg bg-white dark:bg-gray-700 shadow-sm"
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                width: "calc(50% - 4px)",
                left: isLogin ? "calc(50% + 2px)" : "4px",
              }}
            />
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 relative z-10 text-center py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer select-none ${
                !isLogin
                  ? "text-gray-900 dark:text-white font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tLogin("Register")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 relative z-10 text-center py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer select-none ${
                isLogin
                  ? "text-gray-900 dark:text-white font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tLogin("signIn")}
            </button>
          </div>

          {/* ── Dynamic Form ── */}
          <AnimatePresence mode="wait" custom={direction}>
            {isLogin ? (
              <motion.div
                key="login-form"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    {/* Email */}
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field, formState: { errors } }) => (
                        <FormItem className="space-y-1.5">
                          <label
                            htmlFor="login-email"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {tLogin("email")}
                          </label>
                          <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            className={INPUT_CLASS}
                            {...field}
                          />
                          <FormMessage className="text-xs text-red-500 px-1">
                            {errors.email?.message &&
                              errorMessageT(errors.email.message as any)}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    {/* Password */}
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field, formState: { errors } }) => (
                        <FormItem className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor="login-password"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              {tLogin("password")}
                            </label>
                            <Link
                              href="/forgot-password"
                              className="text-xs font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors duration-150 cursor-pointer"
                              tabIndex={-1}
                            >
                              {tLogin("forgotPassword")}
                            </Link>
                          </div>
                          <div className="relative">
                            <input
                              id="login-password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              placeholder="••••••••"
                              className={INPUT_CLASS + " pr-11"}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 cursor-pointer p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                            >
                              {showPassword ? (
                                <EyeOff size={17} />
                              ) : (
                                <Eye size={17} />
                              )}
                            </button>
                          </div>
                          <FormMessage className="text-xs text-red-500 px-1">
                            {errors.password?.message &&
                              errorMessageT(errors.password.message as any)}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    {/* Remember me */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="checkbox"
                        id="remember"
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none"
                      >
                        Stay signed in
                      </label>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
                    >
                      {loginMutation.isPending && (
                        <LoaderCircle className="animate-spin" size={15} />
                      )}
                      {tLogin("signIn")}
                    </button>

                    {/* Divider + OAuth */}
                    <OAuthSection />

                    {/* Fine print */}
                    <FinePrint />
                  </form>
                </Form>
              </motion.div>
            ) : (
              <motion.div
                key="register-form"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-2.5"
                  >
                    {/* Username */}
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field, formState: { errors } }) => (
                        <FormItem className="space-y-1.5">
                          <label
                            htmlFor="reg-username"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {tRegister("username")}
                          </label>
                          <input
                            id="reg-username"
                            type="text"
                            autoComplete="username"
                            placeholder="johndoe"
                            className={INPUT_CLASS}
                            {...field}
                          />
                          <FormMessage className="text-xs text-red-500 px-1">
                            {errors.username?.message &&
                              errorMessageT(errors.username.message as any)}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field, formState: { errors } }) => (
                        <FormItem className="space-y-1.5">
                          <label
                            htmlFor="reg-email"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {tRegister("email")}
                          </label>
                          <input
                            id="reg-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            className={INPUT_CLASS}
                            {...field}
                          />
                          <FormMessage className="text-xs text-red-500 px-1">
                            {errors.email?.message &&
                              errorMessageT(errors.email.message as any)}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    {/* Password */}
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field, formState: { errors } }) => (
                        <FormItem className="space-y-1.5">
                          <label
                            htmlFor="reg-password"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {tRegister("password")}
                          </label>
                          <div className="relative">
                            <input
                              id="reg-password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="••••••••"
                              className={INPUT_CLASS + " pr-11"}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 cursor-pointer p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                            >
                              {showPassword ? (
                                <EyeOff size={17} />
                              ) : (
                                <Eye size={17} />
                              )}
                            </button>
                          </div>
                          <FormMessage className="text-xs text-red-500 px-1">
                            {errors.password?.message &&
                              errorMessageT(errors.password.message as any)}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    {/* Confirm Password */}
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field, formState: { errors } }) => (
                        <FormItem className="space-y-1.5">
                          <label
                            htmlFor="reg-confirm-password"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {tRegister("confirmPassword")}
                          </label>
                          <div className="relative">
                            <input
                              id="reg-confirm-password"
                              type={showConfirmPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="••••••••"
                              className={INPUT_CLASS + " pr-11"}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((v) => !v)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 cursor-pointer p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                              aria-label={
                                showConfirmPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff size={17} />
                              ) : (
                                <Eye size={17} />
                              )}
                            </button>
                          </div>
                          <FormMessage className="text-xs text-red-500 px-1">
                            {errors.confirmPassword?.message &&
                              errorMessageT(
                                errors.confirmPassword.message as any
                              )}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
                    >
                      {registerMutation.isPending && (
                        <LoaderCircle className="animate-spin" size={15} />
                      )}
                      {tRegister("signUp")}
                    </button>

                    {/* Divider + OAuth */}
                    <OAuthSection />
                  </form>
                </Form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */

function OAuthSection() {
  return (
    <>
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
          Or continue with
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={authApiRequest.getGoogleOAuthUrl()}
          className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <svg
            className="flex-shrink-0"
            viewBox="0 0 24 24"
            style={{ width: 18, height: 18 }}
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Google
          </span>
        </Link>

        <Link
          href={authApiRequest.getGithubOAuthUrl()}
          className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <svg
            className="text-gray-800 dark:text-white flex-shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: 18, height: 18 }}
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            GitHub
          </span>
        </Link>
      </div>
    </>
  );
}

function FinePrint() {
  return (
    <p className="text-center text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
      By continuing, you agree to our{" "}
      <Link
        href="/terms"
        className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
      >
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link
        href="/privacy"
        className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}
