'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api, ApiError } from '@/lib/api';
import { Loader2, ArrowLeft, Mail, KeyRound, CheckCircle } from 'lucide-react';

// Step 1: Email input
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

// Step 2: Verification code
const codeSchema = z.object({
  code: z.string().length(6, 'Please enter the 6-digit verification code'),
});

// Step 3: New password
const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type EmailInput = z.infer<typeof emailSchema>;
type CodeInput = z.infer<typeof codeSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 form
  const emailForm = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
  });

  // Step 2 form
  const codeForm = useForm<CodeInput>({
    resolver: zodResolver(codeSchema),
  });

  // Step 3 form
  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
  });

  // Step 1: Request password reset
  const handleEmailSubmit = async (data: EmailInput) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
      setStep(2);
      toast({
        title: 'Verification Code Sent',
        description: 'If your email is registered, a verification code has been sent.',
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: 'destructive',
        title: 'Error',
        description: apiError.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code
  const handleCodeSubmit = async (data: CodeInput) => {
    setIsLoading(true);
    try {
      const response = await api.post<{ tempToken: string; expiresAt: string }>(
        '/auth/verify-reset-code',
        { email, code: data.code }
      );
      setTempToken(response.data!.tempToken);
      setStep(3);
      toast({
        title: 'Verification Complete',
        description: 'Please set a new password.',
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: apiError.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set new password
  const handlePasswordSubmit = async (data: PasswordInput) => {
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        tempToken,
        password: data.password,
      });
      setStep(4); // Success state
      toast({
        title: 'Password Changed',
        description: 'Please login with your new password.',
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: 'destructive',
        title: 'Error',
        description: apiError.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            bulag
          </Link>
          <CardTitle className="text-xl">Forgot Password</CardTitle>
          <CardDescription>
            {step === 1 && 'Enter the email you used when signing up'}
            {step === 2 && 'Enter the verification code sent to your email'}
            {step === 3 && 'Set a new password'}
            {step === 4 && 'Your password has been successfully changed'}
          </CardDescription>
        </CardHeader>

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    {...emailForm.register('email')}
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Verification Code
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </Button>
            </CardFooter>
          </form>
        )}

        {/* Step 2: Verification Code */}
        {step === 2 && (
          <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)}>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Email sent to</p>
                <p className="font-medium">{email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  {...codeForm.register('code')}
                />
                {codeForm.formState.errors.code && (
                  <p className="text-sm text-destructive">
                    {codeForm.formState.errors.code.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Re-enter Email
              </Button>
            </CardFooter>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter 8+ characters"
                    className="pl-10"
                    {...passwordForm.register('password')}
                  />
                </div>
                {passwordForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    className="pl-10"
                    {...passwordForm.register('confirmPassword')}
                  />
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </CardFooter>
          </form>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="rounded-full bg-green-100 p-4 mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">Password Changed</h3>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  You can now login with your new password.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href="/login">Login</Link>
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
