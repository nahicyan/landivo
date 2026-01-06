import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

// client/src/components/Layout/Layout.jsx
export default function Layout() {
  return (
    <div className="bg-[#FDF8F2] text-[#333] h-screen flex flex-col overflow-hidden">
      <header className="shrink-0 sticky top-0 z-50 w-full bg-[#FDF8F2] border-b border-[#e3a04f]">
        <Header />
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
        <footer className="bg-[#EFE8DE]">
          <Footer />
        </footer>
      </main>
    </div>
  );
}
