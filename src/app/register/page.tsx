import { AuthForm } from "@/components/auth/auth-form";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center px-4 py-10">
      <AuthForm mode="register" error={params.error} />
    </main>
  );
}
