'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  registerEmailSchema,
  verifyEmailSchema,
  completeRegistrationSchema,
  registerGeneralEmailSchema,
  verifyGeneralEmailSchema,
  completeGeneralRegistrationSchema,
  RegisterEmailInput,
  VerifyEmailInput,
  CompleteRegistrationInput,
  RegisterGeneralEmailInput,
  VerifyGeneralEmailInput,
  CompleteGeneralRegistrationInput,
} from '@blind/shared';
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
import {
  useRegisterEmail,
  useVerifyEmail,
  useCompleteRegistration,
  useRegisterGeneralEmail,
  useVerifyGeneralEmail,
  useCompleteGeneralRegistration,
} from '@/hooks/use-auth';
import { Loader2, Check, Mail, Shield, KeyRound, Building2, User, ArrowLeft, UserPlus, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type RegistrationType = 'select' | 'company' | 'general';
type CompanyStep = 'email' | 'verify' | 'complete';
type GeneralStep = 'email' | 'verify' | 'complete';

export default function RegisterPage() {
  const router = useRouter();
  const [registrationType, setRegistrationType] = useState<RegistrationType>('select');
  const [companyStep, setCompanyStep] = useState<CompanyStep>('email');
  const [generalStep, setGeneralStep] = useState<GeneralStep>('email');
  const [email, setEmail] = useState('');
  const [generalEmail, setGeneralEmail] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [generalTempToken, setGeneralTempToken] = useState('');
  const [company, setCompany] = useState<{ name: string } | null>(null);

  const registerEmail = useRegisterEmail();
  const verifyEmail = useVerifyEmail();
  const completeRegistration = useCompleteRegistration();
  const registerGeneralEmail = useRegisterGeneralEmail();
  const verifyGeneralEmail = useVerifyGeneralEmail();
  const completeGeneralRegistration = useCompleteGeneralRegistration();

  // Company registration forms
  const emailForm = useForm<RegisterEmailInput>({
    resolver: zodResolver(registerEmailSchema),
  });

  const verifyForm = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: '' },
  });

  const completeForm = useForm<CompleteRegistrationInput>({
    resolver: zodResolver(completeRegistrationSchema),
  });

  // General registration forms (with email verification)
  const generalEmailForm = useForm<RegisterGeneralEmailInput>({
    resolver: zodResolver(registerGeneralEmailSchema),
  });

  const generalVerifyForm = useForm<VerifyGeneralEmailInput>({
    resolver: zodResolver(verifyGeneralEmailSchema),
    defaultValues: { email: '' },
  });

  const generalCompleteForm = useForm<CompleteGeneralRegistrationInput>({
    resolver: zodResolver(completeGeneralRegistrationSchema),
  });

  const onEmailSubmit = async (data: RegisterEmailInput) => {
    registerEmail.mutate(data, {
      onSuccess: (result) => {
        setEmail(data.email);
        setCompany(result.company);
        verifyForm.setValue('email', data.email);
        setCompanyStep('verify');
      },
    });
  };

  const onVerifySubmit = async (data: VerifyEmailInput) => {
    verifyEmail.mutate(data, {
      onSuccess: (result) => {
        setTempToken(result.tempToken);
        completeForm.setValue('tempToken', result.tempToken);
        setCompanyStep('complete');
      },
    });
  };

  const onCompleteSubmit = async (data: CompleteRegistrationInput) => {
    completeRegistration.mutate(data, {
      onSuccess: () => {
        router.push('/');
      },
    });
  };

  // General email verification handlers
  const onGeneralEmailSubmit = async (data: RegisterGeneralEmailInput) => {
    registerGeneralEmail.mutate(data, {
      onSuccess: () => {
        setGeneralEmail(data.email);
        generalVerifyForm.setValue('email', data.email);
        setGeneralStep('verify');
      },
    });
  };

  const onGeneralVerifySubmit = async (data: VerifyGeneralEmailInput) => {
    verifyGeneralEmail.mutate(data, {
      onSuccess: (result) => {
        setGeneralTempToken(result.tempToken);
        generalCompleteForm.setValue('tempToken', result.tempToken);
        setGeneralStep('complete');
      },
    });
  };

  const onGeneralCompleteSubmit = async (data: CompleteGeneralRegistrationInput) => {
    completeGeneralRegistration.mutate(data, {
      onSuccess: () => {
        router.push('/');
      },
    });
  };

  const handleBack = () => {
    if (registrationType === 'company' && companyStep !== 'email') {
      if (companyStep === 'verify') setCompanyStep('email');
      else if (companyStep === 'complete') setCompanyStep('verify');
    } else if (registrationType === 'general' && generalStep !== 'email') {
      if (generalStep === 'verify') setGeneralStep('email');
      else if (generalStep === 'complete') setGeneralStep('verify');
    } else {
      setRegistrationType('select');
      setCompanyStep('email');
      setGeneralStep('email');
      setEmail('');
      setGeneralEmail('');
      setTempToken('');
      setGeneralTempToken('');
      setCompany(null);
    }
  };

  const companySteps = [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'verify', label: 'Verify', icon: Shield },
    { id: 'complete', label: 'Complete', icon: KeyRound },
  ];

  const generalSteps = [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'verify', label: 'Verify', icon: Shield },
    { id: 'complete', label: 'Complete', icon: UserPlus },
  ];

  const currentStepIndex = companySteps.findIndex((s) => s.id === companyStep);
  const currentGeneralStepIndex = generalSteps.findIndex((s) => s.id === generalStep);

  // Type Selection Screen
  if (registrationType === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              bulag
            </Link>
            <CardTitle className="text-xl">Sign Up</CardTitle>
            <CardDescription>
              Choose how you want to register
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Company Verification Option */}
            <button
              onClick={() => setRegistrationType('company')}
              className="w-full p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Company Verification</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verify with your company email to join as a verified employee.
                    Access company-specific communities.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Verified Badge
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Company Community
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {/* General User Option */}
            <button
              onClick={() => setRegistrationType('general')}
              className="w-full p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">General User</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verify with any email address to join.
                    Participate in public communities.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      Email Verification
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Public Communities
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // General User Registration (with email verification)
  if (registrationType === 'general') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              bulag
            </Link>
            <CardTitle className="text-xl">General Sign Up</CardTitle>
            <CardDescription>
              Verify your email to create an account
            </CardDescription>
          </CardHeader>

          {/* Progress indicator */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between">
              {generalSteps.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      index <= currentGeneralStepIndex
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground text-muted-foreground'
                    }`}
                  >
                    {index < currentGeneralStepIndex ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <s.icon className="h-4 w-4" />
                    )}
                  </div>
                  {index < generalSteps.length - 1 && (
                    <div
                      className={`w-16 h-0.5 mx-2 ${
                        index < currentGeneralStepIndex ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Email */}
          {generalStep === 'email' && (
            <form onSubmit={generalEmailForm.handleSubmit(onGeneralEmailSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="general-email">Email</Label>
                  <Input
                    id="general-email"
                    type="email"
                    placeholder="your@email.com"
                    {...generalEmailForm.register('email')}
                  />
                  {generalEmailForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {generalEmailForm.formState.errors.email.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter your email to receive a verification code
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerGeneralEmail.isPending}
                >
                  {registerGeneralEmail.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Get Verification Code
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBack}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Options
                </Button>
              </CardFooter>
            </form>
          )}

          {/* Step 2: Verify */}
          {generalStep === 'verify' && (
            <form onSubmit={generalVerifyForm.handleSubmit(onGeneralVerifySubmit)}>
              <CardContent className="space-y-4">
                <div className="bg-muted p-3 rounded-md text-center">
                  <p className="text-xs text-muted-foreground">{generalEmail}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="general-code">Verification Code</Label>
                  <Input
                    id="general-code"
                    placeholder="6-digit code"
                    maxLength={6}
                    {...generalVerifyForm.register('code')}
                  />
                  {generalVerifyForm.formState.errors.code && (
                    <p className="text-sm text-destructive">
                      {generalVerifyForm.formState.errors.code.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={verifyGeneralEmail.isPending}
                >
                  {verifyGeneralEmail.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Verify
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBack}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Re-enter Email
                </Button>
              </CardFooter>
            </form>
          )}

          {/* Step 3: Complete */}
          {generalStep === 'complete' && (
            <form onSubmit={generalCompleteForm.handleSubmit(onGeneralCompleteSubmit)}>
              <CardContent className="space-y-4">
                <div className="bg-muted p-3 rounded-md text-center">
                  <p className="text-sm font-medium">Email Verified</p>
                  <p className="text-xs text-muted-foreground">{generalEmail}</p>
                </div>

                {/* Community Guidelines Warning */}
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-800">
                    <strong className="block mb-1">Community Guidelines</strong>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>No profanity, slander, or hate speech</li>
                      <li>Do not share personal information (name, contact info, etc.)</li>
                      <li>Do not share other people's IDs/accounts</li>
                      <li>Violating rules may result in account suspension</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="general-username">Username</Label>
                  <Input
                    id="general-username"
                    placeholder="Enter your username"
                    {...generalCompleteForm.register('username')}
                  />
                  {generalCompleteForm.formState.errors.username && (
                    <p className="text-sm text-destructive">
                      {generalCompleteForm.formState.errors.username.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    4-20 characters, letters, numbers, and underscores only
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="general-password">Password</Label>
                  <Input
                    id="general-password"
                    type="password"
                    placeholder="8+ chars, letters & numbers"
                    {...generalCompleteForm.register('password')}
                  />
                  {generalCompleteForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {generalCompleteForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="general-confirmPassword">Confirm Password</Label>
                  <Input
                    id="general-confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    {...generalCompleteForm.register('confirmPassword')}
                  />
                  {generalCompleteForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {generalCompleteForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <input type="hidden" {...generalCompleteForm.register('tempToken')} />
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={completeGeneralRegistration.isPending}
                >
                  {completeGeneralRegistration.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Complete Sign Up
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    );
  }

  // Company Verification Registration (existing flow)
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            bulag
          </Link>
          <CardTitle className="text-xl">Company Verification</CardTitle>
          <CardDescription>
            Verify with your company email to register
          </CardDescription>
        </CardHeader>

        {/* Progress indicator */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            {companySteps.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    index <= currentStepIndex
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground text-muted-foreground'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <s.icon className="h-4 w-4" />
                  )}
                </div>
                {index < companySteps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${
                      index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Email */}
        {companyStep === 'email' && (
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Company Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  {...emailForm.register('email')}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  We verify your company through your email domain
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={registerEmail.isPending}
              >
                {registerEmail.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Get Verification Code
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Options
              </Button>
            </CardFooter>
          </form>
        )}

        {/* Step 2: Verify */}
        {companyStep === 'verify' && (
          <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)}>
            <CardContent className="space-y-4">
              {company && (
                <div className="bg-muted p-3 rounded-md text-center">
                  <p className="text-sm font-medium">{company.name}</p>
                  <p className="text-xs text-muted-foreground">{email}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  placeholder="6-digit code"
                  maxLength={6}
                  {...verifyForm.register('code')}
                />
                {verifyForm.formState.errors.code && (
                  <p className="text-sm text-destructive">
                    {verifyForm.formState.errors.code.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code sent to your email
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={verifyEmail.isPending}
              >
                {verifyEmail.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Verify
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Re-enter Email
              </Button>
            </CardFooter>
          </form>
        )}

        {/* Step 3: Complete */}
        {companyStep === 'complete' && (
          <form onSubmit={completeForm.handleSubmit(onCompleteSubmit)}>
            <CardContent className="space-y-4">
              {company && (
                <div className="bg-muted p-3 rounded-md text-center">
                  <p className="text-sm font-medium">{company.name}</p>
                  <p className="text-xs text-muted-foreground">Verified</p>
                </div>
              )}

              {/* Community Guidelines Warning */}
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800">
                  <strong className="block mb-1">Community Guidelines</strong>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>No profanity, slander, or hate speech</li>
                    <li>Do not share personal information (name, contact info, etc.)</li>
                    <li>Do not share other people's IDs/accounts</li>
                    <li>Violating rules may result in account suspension</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="8+ chars, letters & numbers"
                  {...completeForm.register('password')}
                />
                {completeForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {completeForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  {...completeForm.register('confirmPassword')}
                />
                {completeForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {completeForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <input type="hidden" {...completeForm.register('tempToken')} />
              <p className="text-xs text-muted-foreground">
                A nickname will be auto-generated (e.g. swift_fox_8472)
              </p>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={completeRegistration.isPending}
              >
                {completeRegistration.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Complete Sign Up
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
