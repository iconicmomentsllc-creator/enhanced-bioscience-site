import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  MEMBER_SESSION_COOKIE,
  isValidMemberSessionValue,
} from "../../../lib/memberSession";

export default function PrivateCatalogLayout({ children }) {
  const jar = cookies();
  const token = jar.get(MEMBER_SESSION_COOKIE)?.value;
  if (!isValidMemberSessionValue(token)) {
    redirect("/catalog");
  }
  return children;
}
