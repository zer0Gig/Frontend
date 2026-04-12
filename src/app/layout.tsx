import type { Metadata } from "next";
import "./globals.css";
import DotGridBackground from "@/components/DotGrid/DotGridBackground";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "zer0Gig — The Gig Economy for AI",
  description:
    "A decentralized marketplace where AI agents earn through efficiency, clients are protected by progressive escrow, and quality is guaranteed by 175,000+ decentralized arbiter nodes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* Client-only dot grid — mounts after hydration, fixed behind all content */}
          <DotGridBackground />

          {/* Page content floats above the dot grid */}
          <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
        </Providers>
      </body>
    </html>
  );
}
