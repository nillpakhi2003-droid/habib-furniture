"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const MENU_ITEMS = [
  { name: "All Products", href: "/products", icon: "🏠" },
  { name: "Bedroom", href: "/products?category=bedroom", icon: "🛏️" },
  { name: "Living Room", href: "/products?category=living", icon: "🛋️" },
  { name: "Dining", href: "/products?category=dining", icon: "🍽️" },
  { name: "Office", href: "/products?category=office", icon: "💼" },
  { name: "Kitchen Cabinet", href: "/products?category=kitchen", icon: "🗄️" },
  { name: "Mattress", href: "/products?category=mattress", icon: "🛌" },
  { name: "Contact Us", href: "/contact", icon: "📞" },
  { name: "My Profile", href: "/admin/login", icon: "👤" },
];

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggleSidebar", handleToggle);
    return () => window.removeEventListener("toggleSidebar", handleToggle);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <Link href="/" onClick={() => setIsOpen(false)}>
              <div className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-2xl shadow-md">
                Habib Furniture
              </div>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-red-600 transition font-medium"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href="tel:+8801700000000" className="text-sm font-medium text-gray-900 hover:text-red-600">
                +880 1700-000000
              </a>
            </div>
            <p className="text-xs text-gray-500">Call us for any inquiries</p>
          </div>
        </div>
      </div>
    </>
  );
}
