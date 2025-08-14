import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { StudentProfile, UpdateStudentProfileInput } from '../../../server/src/schema';

interface ProfileSettingsProps {
  studentProfile: StudentProfile;
  onUpdate: () => void;
}

export function ProfileSettings({ studentProfile, onUpdate }: ProfileSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateStudentProfileInput>({
    id: studentProfile.id,
    phone: studentProfile.phone,
    address: studentProfile.address,
    emergency_contact_name: studentProfile.emergency_contact_name,
    emergency_contact_phone: studentProfile.emergency_contact_phone
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await trpc.updateStudentProfile.mutate(formData);
      setSuccess('Profile updated successfully!');
      onUpdate();
    } catch (error) {
      console.error('Profile update failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">👤 Basic Information</CardTitle>
          <CardDescription>
            This information cannot be changed. Contact administration if updates are needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Student ID</Label>
              <Input value={studentProfile.student_id} disabled />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input 
                value={new Date(studentProfile.date_of_birth).toLocaleDateString()} 
                disabled 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Contact Information (Editable) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📞 Contact Information</CardTitle>
          <CardDescription>
            Update your contact details and emergency contact information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateStudentProfileInput) => ({ 
                    ...prev, 
                    phone: e.target.value || null 
                  }))
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State 12345"
                value={formData.address || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateStudentProfileInput) => ({ 
                    ...prev, 
                    address: e.target.value || null 
                  }))
                }
                disabled={isLoading}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">🚨 Emergency Contact</h4>
              
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  placeholder="Parent/Guardian Name"
                  value={formData.emergency_contact_name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: UpdateStudentProfileInput) => ({ 
                      ...prev, 
                      emergency_contact_name: e.target.value || null 
                    }))
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  placeholder="+1 (555) 987-6543"
                  value={formData.emergency_contact_phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: UpdateStudentProfileInput) => ({ 
                      ...prev, 
                      emergency_contact_phone: e.target.value || null 
                    }))
                  }
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating Profile...
                </>
              ) : (
                '💾 Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Account Information</CardTitle>
          <CardDescription>
            View your account details and registration history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Profile Created</Label>
              <div className="text-sm text-gray-600">
                {new Date(studentProfile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Last Updated</Label>
              <div className="text-sm text-gray-600">
                {new Date(studentProfile.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}