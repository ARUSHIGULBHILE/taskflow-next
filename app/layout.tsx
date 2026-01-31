import type { Metadata } from "next";
import "./globals.css";
import SeedOnce from "../components/SeedOnce";

export const metadata: Metadata = {
  title: "Task Flow",
  description: "Task management frontend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SeedOnce />
        {children}
      </body>
    </html>
  );
}
