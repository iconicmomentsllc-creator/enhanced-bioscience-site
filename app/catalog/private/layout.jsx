import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/authOptions";

export default async function PrivateCatalogLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/catalog");
  }
  return children;
}
