import { Providers } from "../components/Providers";

export const metadata = {
  title: "Enhanced Bioscience",
  description: "Private research membership portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
