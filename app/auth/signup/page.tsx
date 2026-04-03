import { redirect } from "next/navigation";

export default function SignUp() {
  redirect("/auth/signin");
}
