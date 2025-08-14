import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { User, RegisterInput } from '../../../server/src/schema';

interface RegisterFormProps {
  onSuccess: (user: User) => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegisterInput>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    student_id: '',
    date_of_birth: new Date(),
    phone: null,
    address: null,
    emergency_contact_name: null,
    emergency_contact_phone: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await trpc.register.mutate(formData);
      onSuccess(response.user);
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            placeholder="John"
            value={formData.first_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: RegisterInput) => ({ ...prev, first_name: e.target.value }))
            }
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            placeholder="Doe"
            value={formData.last_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: RegisterInput) => ({ ...prev, last_name: e.target.value }))
            }
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="john.doe@student.edu"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: RegisterInput) => ({ ...prev, email: e.target.value }))
          }
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 6 characters"
          value={formData.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: RegisterInput) => ({ ...prev, password: e.target.value }))
          }
          required
          disabled={isLoading}
          minLength={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="student_id">Student ID</Label>
        <Input
          id="student_id"
          placeholder="STU123456"
          value={formData.student_id}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: RegisterInput) => ({ ...prev, student_id: e.target.value }))
          }
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date_of_birth">Date of Birth</Label>
        <Input
          id="date_of_birth"
          type="date"
          value={formData.date_of_birth.toISOString().split('T')[0]}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: RegisterInput) => ({ 
              ...prev, 
              date_of_birth: new Date(e.target.value) 
            }))
          }
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (Optional)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={formData.phone || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: RegisterInput) => ({ 
              ...prev, 
              phone: e.target.value || null 
            }))
          }
          disabled={isLoading}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-green-600 hover:bg-green-700" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Account...
          </>
        ) : (
          '✨ Create Account'
        )}
      </Button>
    </form>
  );
}