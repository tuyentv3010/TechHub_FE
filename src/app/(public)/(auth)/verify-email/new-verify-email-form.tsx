"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface VerifyEmailFormData {
  code1: string;
  code2: string;
  code3: string;
  code4: string;
}

export default function NewVerifyEmailForm() {
  const t = useTranslations("VerifyEmail");
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<VerifyEmailFormData>({
    defaultValues: {
      code1: "",
      code2: "",
      code3: "",
      code4: "",
    },
  });

  const onSubmit = async (data: VerifyEmailFormData) => {
    const code = `${data.code1}${data.code2}${data.code3}${data.code4}`;
    
    if (code.length !== 4) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter all 4 digits",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Call verify email API
      // const result = await verifyEmailMutation.mutateAsync({ email, code });
      
      toast({
        title: "Success",
        description: "Email verified successfully",
      });
      
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error: any) {
      console.error("Verify email error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Verification failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      // TODO: Call resend code API
      // const result = await resendCodeMutation.mutateAsync({ email });
      
      toast({
        title: "Success",
        description: "Verification code resent",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to resend code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const value = e.target.value;
    
    // Only allow single digit
    if (value.length > 1) {
      e.target.value = value.slice(0, 1);
      return;
    }

    // Auto focus next input
    if (value.length === 1) {
      const nextField = getNextField(field);
      if (nextField) {
        const nextInput = document.getElementById(nextField) as HTMLInputElement;
        nextInput?.focus();
      }
    }
  };

  const getNextField = (currentField: string): string | null => {
    const fields = ["code1", "code2", "code3", "code4"];
    const currentIndex = fields.indexOf(currentField);
    return currentIndex < fields.length - 1 ? fields[currentIndex + 1] : null;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Email Verification
            </h1>
            <p className="text-gray-600">
              You have sent code to your Email <span className="font-medium">{email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}</span>
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* OTP Input Fields */}
              <div className="flex gap-4 justify-center">
                {["code1", "code2", "code3", "code4"].map((fieldName, index) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName as keyof VerifyEmailFormData}
                    render={({ field }) => (
                      <FormItem>
                        <Input
                          {...field}
                          id={fieldName}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className="w-16 h-16 text-center text-2xl font-semibold border-2 focus:border-blue-600"
                          onChange={(e) => {
                            field.onChange(e);
                            handleCodeInput(e, fieldName);
                          }}
                        />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading && (
                  <LoaderCircle className="animate-spin mr-2" size={20} />
                )}
                Veryfy Account
              </Button>

              {/* Resend link */}
              <div className="text-center text-sm text-gray-600">
                Didn&apos;t receive code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-medium text-blue-600 hover:text-blue-700"
                  disabled={isLoading}
                >
                  Resend
                </button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative w-full h-full max-w-2xl">
            <Image
              src="/hero/student-learning.png"
              alt="Student learning"
              fill
              className="rounded-2xl object-cover shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
