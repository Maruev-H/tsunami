"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useEffect, useState } from "react";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className="ts-nav-link"
      data-active={active ? "true" : "false"}
    >
      {label}
    </Link>
  );
}

export function TsunamiHeader() {
  const { totalItems } = useCart();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navContent = (
    <>
      <NavLink href="/" label="Главная" />
      <NavLink href="/menu" label="Меню" />
      <NavLink href="/admin" label="Админ" />

      <Link href="/cart" className="ts-cart-button">
        <span>Корзина</span>
        <span className="ts-cart-badge">{totalItems}</span>
      </Link>
    </>
  );

  return (
    <header className="ts-nav">
      <div className="ts-nav-inner">
        <Link href="/" className="ts-logo">
          <Image
            src="/TsunamiLogo24.svg"
            alt="Tsunami"
            width={164}
            height={40}
            className="ts-logo-img"
            priority
          />
        </Link>

        <div className="ts-nav-right">
          <nav
            className="ts-nav-links ts-nav-links-desktop"
            aria-label="Основная навигация"
          >
            {navContent}
          </nav>

          <button
            type="button"
            className="ts-nav-toggle"
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isMenuOpen}
            aria-controls="tsunami-mobile-menu"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span className="ts-nav-toggle-bar" />
            <span className="ts-nav-toggle-bar" />
            <span className="ts-nav-toggle-bar" />
          </button>
        </div>
      </div>

      <nav
        id="tsunami-mobile-menu"
        className={`ts-nav-links ts-nav-links-mobile${
          isMenuOpen ? " ts-nav-links-mobile-open" : ""
        }`}
        aria-label="Основная навигация (мобильная)"
      >
        {navContent}
      </nav>
    </header>
  );
}
