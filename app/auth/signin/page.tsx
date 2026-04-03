import { redirect } from "next/navigation";
import SignInForm from "@/components/sign-in-form";
import { getCurrentAuthUser } from "@/lib/auth-server";

export default async function SignIn() {
  const user = await getCurrentAuthUser();

  if (user) {
    redirect("/calendar");
  }

  return <SignInForm />;
}
