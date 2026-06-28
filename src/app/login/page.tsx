import { AuthForm } from "@/components/auth/auth-form";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center px-4 py-10">
      <AuthForm mode="login" error={params.error} message={params.message} next={params.next} />
    </main>
  );
}
