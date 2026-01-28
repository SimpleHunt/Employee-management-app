import Image from "next/image";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full py-5 bg-white border-t border-gray-200 z-50 flex items-center justify-center gap-2 text-sm">
      <span className="text-gray-900">2025 © — Developed By</span>
      <Image
        src="/simpleHunt.png"
        alt="Simple Hunt Logo"
        width={120}
        height={60}
      />
    </footer>
  );
}
