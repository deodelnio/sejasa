"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

// 1. Validation Schema
const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], 
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [errorStatus, setErrorStatus] = useState<"" | "already-registered" | "other-error">("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 2. Form Setup
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema as any), 
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // 3. Submit Handler
  const onSubmit = async (values: SignupFormValues) => {
    setErrorStatus("");
    setErrorMessage("");
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(userCredential.user, { displayName: values.name });
      router.push("/");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setErrorStatus("already-registered");
      } else {
        setErrorStatus("other-error");
        setErrorMessage("We couldn't create your account right now. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setErrorStatus("");
    setErrorMessage("");
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setErrorStatus("other-error");
        setErrorMessage("Google sign-up was interrupted. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        
        {/* ALERT: Text with clickable "sign in" link */}
        {errorStatus !== "" && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Registration Failed</AlertTitle>
            <AlertDescription>
              {errorStatus === "already-registered" ? (
                <span>
                  This email address is already registered. Please{" "}
                  <a 
                    href="/login" 
                    className="font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity"
                  >
                    sign in
                  </a>{" "}
                  instead.
                </span>
              ) : (
                errorMessage
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                  <Input 
                    {...field} 
                    id={field.name} 
                    aria-invalid={fieldState.invalid} 
                    placeholder="John Doe" 
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input 
                    {...field} 
                    id={field.name} 
                    type="email"
                    aria-invalid={fieldState.invalid} 
                    placeholder="john@example.com" 
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input 
                    {...field} 
                    id={field.name} 
                    type="password"
                    aria-invalid={fieldState.invalid} 
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                  <Input 
                    {...field} 
                    id={field.name} 
                    type="password"
                    aria-invalid={fieldState.invalid} 
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            <FieldGroup className="mt-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
              <Button 
                variant="outline" 
                type="button" 
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                Sign up with Google
              </Button>
              <div className="text-center text-sm text-muted-foreground mt-2">
                Already have an account?{" "}
                <a href="/login" className="underline underline-offset-4 hover:text-primary">
                  Sign in
                </a>
              </div>
            </FieldGroup>

          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}