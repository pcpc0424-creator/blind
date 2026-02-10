'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import {
  Megaphone,
  Building2,
  Mail,
  Phone,
  User,
  DollarSign,
  Clock,
  MessageSquare,
  CheckCircle,
  Loader2,
  BarChart3,
  Users,
  Target,
} from 'lucide-react';

const adTypes = [
  { value: 'BANNER', label: 'Banner Ads', description: 'Display ads on various pages' },
  { value: 'SPONSORED', label: 'Sponsored Posts', description: 'Promoted content in feeds' },
  { value: 'NEWSLETTER', label: 'Newsletter Ads', description: 'Ads in email newsletters' },
  { value: 'PARTNERSHIP', label: 'Partnership', description: 'Long-term collaboration' },
  { value: 'OTHER', label: 'Other', description: 'Custom advertising solutions' },
];

const budgetRanges = [
  { value: 'under_1000', label: 'Under $1,000' },
  { value: '1000_5000', label: '$1,000 - $5,000' },
  { value: '5000_10000', label: '$5,000 - $10,000' },
  { value: '10000_50000', label: '$10,000 - $50,000' },
  { value: 'over_50000', label: 'Over $50,000' },
  { value: 'negotiable', label: 'Negotiable' },
];

const durationOptions = [
  { value: '1_week', label: '1 Week' },
  { value: '2_weeks', label: '2 Weeks' },
  { value: '1_month', label: '1 Month' },
  { value: '3_months', label: '3 Months' },
  { value: '6_months', label: '6 Months' },
  { value: '1_year', label: '1 Year' },
  { value: 'ongoing', label: 'Ongoing' },
];

export default function AdvertisePage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    adType: '',
    budget: '',
    duration: '',
    message: '',
  });

  const submitInquiry = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.post('/ad-inquiries', data);
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitInquiry.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
              <p className="text-muted-foreground mb-6">
                Your advertising inquiry has been submitted successfully.
                <br />
                Our team will contact you within 1-2 business days.
              </p>
              <Button onClick={() => setSubmitted(false)}>
                Submit Another Inquiry
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Megaphone className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Advertise with Us</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Reach thousands of professionals across various industries.
            Get your brand in front of the right audience.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="py-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">100K+</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">5M+</p>
              <p className="text-sm text-muted-foreground">Monthly Views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">500+</p>
              <p className="text-sm text-muted-foreground">Companies</p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Us for Advertising</CardTitle>
            <CardDescription>
              Fill out the form below and our advertising team will get back to you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Your company name"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contactName"
                        className="pl-10"
                        placeholder="Your name"
                        value={formData.contactName}
                        onChange={(e) => handleChange('contactName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        className="pl-10"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Advertising Details */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Advertising Details
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="adType">Ad Type *</Label>
                    <Select
                      value={formData.adType}
                      onValueChange={(value) => handleChange('adType', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ad type" />
                      </SelectTrigger>
                      <SelectContent>
                        {adTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget Range</Label>
                    <Select
                      value={formData.budget}
                      onValueChange={(value) => handleChange('budget', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetRanges.map((range) => (
                          <SelectItem key={range.value} value={range.value}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select
                      value={formData.duration}
                      onValueChange={(value) => handleChange('duration', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  <MessageSquare className="h-4 w-4 inline mr-2" />
                  Message *
                </Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your advertising goals, target audience, and any specific requirements..."
                  rows={5}
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  required
                  minLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 characters
                </p>
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitInquiry.isPending || !formData.adType || !formData.message}
                >
                  {submitInquiry.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Inquiry
                </Button>
              </div>

              {submitInquiry.isError && (
                <p className="text-sm text-destructive text-center">
                  Failed to submit inquiry. Please try again.
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Ad Types Info */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Advertising Options</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adTypes.map((type) => (
              <Card key={type.value} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{type.label}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
