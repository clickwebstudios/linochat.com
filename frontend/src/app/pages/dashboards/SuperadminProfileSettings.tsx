import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Search,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Key,
  Shield,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Separator } from '../../components/ui/separator';
import { ProjectSelector } from '../../components/ProjectSelector';
import { ProfileDropdown } from '../../components/ProfileDropdown';

export default function SuperadminProfileSettings() {
  const [twoFaSetupOpen, setTwoFaSetupOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
        <div className="flex items-center gap-4">
          <ProjectSelector />
          <div className="relative w-96 hidden md:block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users, settings..." className="pl-10" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
          </Button>
          <ProfileDropdown basePath="/superadmin" isSuperadmin={true} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-muted/50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold">Profile Information</CardTitle>
              <CardDescription>Update your personal information and photo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">AD</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Camera className="mr-2 h-4 w-4" />
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG, GIF or PNG. Max size of 2MB</p>
                </div>
              </div>

              <Separator />

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="User" />
                </div>
              </div>

              {/* Contact Fields */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" defaultValue="admin@linochat.com" className="pl-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" defaultValue="+1 (555) 999-0001" className="pl-10" />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us a little about yourself..."
                  defaultValue="Platform administrator with full access to manage all companies, users, and system settings."
                  rows={4}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="location" defaultValue="San Francisco, CA" className="pl-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold">Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email about system alerts and updates</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Desktop Notifications</Label>
                  <p className="text-sm text-muted-foreground">Show desktop notifications for critical alerts</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Alerts</Label>
                  <p className="text-sm text-muted-foreground">Play sound for system notifications</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">Get a weekly summary of platform activity</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified about security-related events</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* System Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold">System Preferences</CardTitle>
              <CardDescription>Manage your administrative preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Advanced Options</Label>
                  <p className="text-sm text-muted-foreground">Display advanced configuration options in dashboard</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">Log all administrative actions for audit trail</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold">Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button variant="outline">Update Password</Button>

              <Separator />

              {/* Two-Factor Authentication */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-secondary mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-base">Two-Factor Authentication (2FA)</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add an extra layer of security to your account. Highly recommended for superadmin accounts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-secondary/10 p-4 rounded-lg border border-secondary/20">
                  <div className="space-y-0.5">
                    <Label>Enable 2FA</Label>
                    <p className="text-sm text-muted-foreground">
                      Require authentication code in addition to password
                    </p>
                  </div>
                  <Switch
                    onCheckedChange={(checked) => {
                      if (checked) setTwoFaSetupOpen(true);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom spacing for save bar */}
          <div className="h-4"></div>
        </div>
      </main>

      {/* Save Panel - sticky at bottom of flex column */}
      <div className="bg-card border-t shadow-lg shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground hidden sm:block">
            Remember to save your changes before leaving this page.
          </p>
          <div className="flex gap-3 ml-auto">
            <Button variant="outline" asChild>
              <Link to="/superadmin/dashboard">Cancel</Link>
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* 2FA Setup Dialog */}
      <Dialog open={twoFaSetupOpen} onOpenChange={setTwoFaSetupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code below with your authenticator app (e.g. Google Authenticator, Authy), then enter the 6-digit code to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border">
              <p className="text-sm text-muted-foreground text-center px-4">QR code will appear here</p>
            </div>
            <Input placeholder="Enter 6-digit code" className="max-w-48 text-center tracking-widest" maxLength={6} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTwoFaSetupOpen(false)}>Cancel</Button>
            <Button onClick={() => setTwoFaSetupOpen(false)}>Verify & Enable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}