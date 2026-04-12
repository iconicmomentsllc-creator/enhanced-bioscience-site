import { getServerSession } from "next-auth";
import { Providers } from "../components/Providers";
import { authOptions } from "../lib/authOptions";

export const metadata = {
  title: "Enhanced Bioscience",
  description: "Private research membership portal",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
