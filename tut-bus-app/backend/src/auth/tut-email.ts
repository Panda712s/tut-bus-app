/**
 * TUT issues students addresses on the `tut4life.ac.za` domain; staff and
 * administrators use `tut.ac.za`. Student registration and student sign-in
 * only accept `tut4life.ac.za` addresses.
 */
export const TUT_STUDENT_EMAIL_REGEX = /^[^@\s]+@tut4life\.ac\.za$/i;

export function isTutStudentEmail(email: string): boolean {
  return TUT_STUDENT_EMAIL_REGEX.test(email.trim());
}
