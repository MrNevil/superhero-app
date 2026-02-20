import "../styles/globals.css";
import { Space_Grotesk, Playfair_Display } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif"
});

export const metadata = {
  title: "Hero Atlas",
  description: "Browse heroes, build teams, and save favorites"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
