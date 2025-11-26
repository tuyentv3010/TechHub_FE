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
import { useState, useRef } from "react";
import { useVerifyEmailMutation } from "@/queries/useAuth";

interface VerifyEmailFormData {
  code1: string;
  code2: string;
  code3: string;
  code4: string;
  code5: string;
  code6: string;
}

export default function NewVerifyEmailForm() {
  const t = useTranslations("VerifyEmail");
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isLoading, setIsLoading] = useState(false);
  const verifyEmailMutation = useVerifyEmailMutation();

  // Refs for OTP inputs
  const code1Ref = useRef<HTMLInputElement | null>(null);
  const code2Ref = useRef<HTMLInputElement | null>(null);
  const code3Ref = useRef<HTMLInputElement | null>(null);
  const code4Ref = useRef<HTMLInputElement | null>(null);
  const code5Ref = useRef<HTMLInputElement | null>(null);
  const code6Ref = useRef<HTMLInputElement | null>(null);

  const form = useForm<VerifyEmailFormData>({
    defaultValues: {
      code1: "",
      code2: "",
      code3: "",
      code4: "",
      code5: "",
      code6: "",
    },
  });

  const onSubmit = async (data: VerifyEmailFormData) => {
    const code = `${data.code1}${data.code2}${data.code3}${data.code4}${data.code5}${data.code6}`;
    
    console.log('onSubmit triggered with code:', code);
    
    if (code.length !== 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter all 6 digits",
      });
      return;
    }

    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Email is required",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Calling verify email API with:', { email, code });
      
      const result = await verifyEmailMutation.mutateAsync({ email, code });
      
      console.log('Verify email API result:', result);
      
      if (result.payload.success) {
        toast({
          title: "Success",
          description: "Email verified successfully",
        });
        
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.payload.message || "Verification failed",
        });
      }
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
    currentField: keyof VerifyEmailFormData,
    nextRef: React.RefObject<HTMLInputElement | null> | null
  ) => {
    let value = e.target.value;
    
    console.log('handleCodeInput - Before:', { currentField, value, length: value.length });

    // Only allow numbers and take only the last character
    value = value.replace(/\D/g, '').slice(-1);
    
    console.log('handleCodeInput - After clean:', { currentField, value, length: value.length });
    
    // Update the input value
    e.target.value = value;

    // Update form value
    form.setValue(currentField, value);
    
    console.log('handleCodeInput - Set value:', { currentField, value });

    // Auto focus to next input
    if (value && nextRef?.current) {
      console.log('handleCodeInput - Moving to next field');
      nextRef.current.focus();
    }
  };

  const handleCodeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    prevRef: React.RefObject<HTMLInputElement | null> | null
  ) => {
    console.log('handleCodeKeyDown:', { key: e.key, value: e.currentTarget.value });
    
    // Move to previous input on backspace if current is empty
    if (e.key === "Backspace" && !e.currentTarget.value && prevRef?.current) {
      console.log('handleCodeKeyDown - Moving to previous field');
      prevRef.current.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    console.log('handleCodePaste:', { pastedData, length: pastedData.length });
    
    if (pastedData.length === 6) {
      form.setValue("code1", pastedData[0] || "");
      form.setValue("code2", pastedData[1] || "");
      form.setValue("code3", pastedData[2] || "");
      form.setValue("code4", pastedData[3] || "");
      form.setValue("code5", pastedData[4] || "");
      form.setValue("code6", pastedData[5] || "");
      code6Ref.current?.focus();
      console.log('handleCodePaste - All values set');
    }
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
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Verification Code
                </Label>
                <div className="flex gap-3 justify-between" onPaste={handleCodePaste}>
                  {[
                    { name: "code1" as const, ref: code1Ref, next: code2Ref, prev: null },
                    { name: "code2" as const, ref: code2Ref, next: code3Ref, prev: code1Ref },
                    { name: "code3" as const, ref: code3Ref, next: code4Ref, prev: code2Ref },
                    { name: "code4" as const, ref: code4Ref, next: code5Ref, prev: code3Ref },
                    { name: "code5" as const, ref: code5Ref, next: code6Ref, prev: code4Ref },
                    { name: "code6" as const, ref: code6Ref, next: null, prev: code5Ref },
                  ].map((field) => (
                    <FormField
                      key={field.name}
                      control={form.control}
                      name={field.name}
                      render={({ field: formField }) => (
                        <FormItem className="flex-1">
                          <Input
                            {...formField}
                            ref={field.ref}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className="w-full h-14 text-center text-2xl font-semibold border-2 focus:border-blue-600 rounded-lg"
                            onChange={(e) => {
                              console.log('Input onChange triggered:', { field: field.name, value: e.target.value });
                              formField.onChange(e);
                              handleCodeInput(e, field.name, field.next);
                            }}
                            onKeyDown={(e) => handleCodeKeyDown(e, field.prev)}
                          />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
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
                Verify Account
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
