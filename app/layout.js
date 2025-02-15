import './globals.css'

export const metadata = {
  title: 'Trip Budget Tracker',
  description: 'Track your trip expenses and budget',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="./favicon.ico" />
        <link rel="apple-touch-icon" href="./icon.png" />
      </head>
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}