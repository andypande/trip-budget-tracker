import './globals.css'

export const metadata = {
  title: 'Trip Budget Tracker',
  description: 'Track your trip expenses and budget',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}