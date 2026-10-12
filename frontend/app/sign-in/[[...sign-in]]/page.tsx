import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-indigo-50 p-4">
      <SignIn />
    </main>
  );
}
