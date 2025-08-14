import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { StudentProfile, Course, CreateRegistrationInput } from '../../../server/src/schema';

interface RegistrationFormProps {
  studentProfile: StudentProfile;
  availableCourses: Course[];
  onSuccess: () => void;
}

export function RegistrationForm({ studentProfile, availableCourses, onSuccess }: RegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [semester, setSemester] = useState<'fall' | 'spring' | 'summer'>('fall');
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const registrationData: CreateRegistrationInput = {
        student_profile_id: studentProfile.id,
        course_id: parseInt(selectedCourse),
        semester,
        year
      };

      await trpc.createRegistration.mutate(registrationData);
      setSuccess('Registration submitted successfully! Please wait for approval.');
      setSelectedCourse('');
      onSuccess();
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCourseData = availableCourses.find(c => c.id.toString() === selectedCourse);
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];

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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Semester</Label>
            <Select value={semester} onValueChange={(value: 'fall' | 'spring' | 'summer') => setSemester(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fall">🍂 Fall</SelectItem>
                <SelectItem value="spring">🌸 Spring</SelectItem>
                <SelectItem value="summer">☀️ Summer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Year</Label>
            <Select value={year.toString()} onValueChange={(value: string) => setYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.map((course: Course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedCourseData && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                {selectedCourseData.code} - {selectedCourseData.name}
                <Badge variant="secondary">{selectedCourseData.credits} Credits</Badge>
              </CardTitle>
              <CardDescription className="text-blue-700">
                {selectedCourseData.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-blue-800">
                <span>
                  Enrollment: {selectedCourseData.current_enrollment}/{selectedCourseData.max_enrollment}
                </span>
                <span>
                  {selectedCourseData.is_active ? '✅ Active' : '❌ Inactive'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Button 
          type="submit" 
          className="w-full bg-green-600 hover:bg-green-700" 
          disabled={isLoading || !selectedCourse}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting Registration...
            </>
          ) : (
            '📝 Submit Registration'
          )}
        </Button>
      </form>

      {availableCourses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🏫</div>
          <p>No courses available for registration at this time.</p>
        </div>
      )}

      {availableCourses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Available Courses</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {availableCourses.map((course: Course) => (
              <Card 
                key={course.id} 
                className={`cursor-pointer transition-colors ${
                  selectedCourse === course.id.toString() 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => setSelectedCourse(course.id.toString())}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    {course.code} - {course.name}
                    <Badge variant="outline">{course.credits} Credits</Badge>
                  </CardTitle>
                  <CardDescription>
                    {course.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      {course.current_enrollment}/{course.max_enrollment} enrolled
                    </span>
                    <span>
                      {course.semester} {course.year}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}