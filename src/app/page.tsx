import { redirect } from "next/navigation";
import { DEFAULT_AFTER_LOGIN_PATH } from "@/lib/auth/constants";

export default function Home() {
  redirect(DEFAULT_AFTER_LOGIN_PATH);
}
