import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RegistrationForm } from './RegistrationForm';
import { ProfileSettings } from './ProfileSettings';
import { trpc } from '@/utils/trpc';
import type { User, DashboardData, Registration, Course } from '../../../server/src/schema';

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.getDashboard.query({ userId: user.id });
      setDashboardData(data);
      setError(null);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRegistrationSuccess = () => {
    loadDashboardData(); // Refresh dashboard data after successful registration
  };

  const handleWithdrawRegistration = async (registrationId: number) => {
    if (!dashboardData) return;
    
    try {
      await trpc.withdrawRegistration.mutate({
        registrationId,
        studentProfileId: dashboardData.student_profile.id
      });
      loadDashboardData(); // Refresh data after withdrawal
    } catch (error) {
      console.error('Failed to withdraw registration:', error);
      setError('Failed to withdraw registration. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return '✅';
      case 'pending':
        return '⏳';
      case 'rejected':
        return '❌';
      case 'withdrawn':
        return '🚫';
      default:
        return '❓';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error || 'Failed to load dashboard data'}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDashboardData}
            className="ml-4"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          🎓 Welcome to Your Academic Hub
        </h2>
        <p className="text-gray-600">
          Manage your courses, registrations, and academic profile
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800">
              📚 Active Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {dashboardData.current_registrations.filter(r => r.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800">
              ⏳ Pending Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {dashboardData.current_registrations.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-800">
              🎯 Available Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {dashboardData.available_courses.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="registrations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="registrations">My Registrations</TabsTrigger>
          <TabsTrigger value="register">Register for Courses</TabsTrigger>
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 Current Registrations
              </CardTitle>
              <CardDescription>
                View and manage your course registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.current_registrations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📚</div>
                  <p>No registrations yet. Start by registering for courses!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.current_registrations.map((registration: Registration) => {
                    const course = dashboardData.available_courses.find((c: Course) => c.id === registration.course_id);
                    return (
                      <div key={registration.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {course?.code} - {course?.name}
                            </h3>
                            <p className="text-gray-600">{course?.description}</p>
                            <p className="text-sm text-gray-500">
                              Credits: {course?.credits} | {registration.semester} {registration.year}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={`${getStatusColor(registration.status)} mb-2`}>
                              {getStatusIcon(registration.status)} {registration.status.toUpperCase()}
                            </Badge>
                            {registration.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWithdrawRegistration(registration.id)}
                                className="block text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Registered: {new Date(registration.registration_date).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ➕ Course Registration
              </CardTitle>
              <CardDescription>
                Register for new courses this semester
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationForm
                studentProfile={dashboardData.student_profile}
                availableCourses={dashboardData.available_courses}
                onSuccess={handleRegistrationSuccess}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👤 Profile Settings
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings
                studentProfile={dashboardData.student_profile}
                onUpdate={loadDashboardData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}