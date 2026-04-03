"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "../context/CartContext";

export function TsunamiHeader() {
  const { totalItems, totalPrice } = useCart();

  const navContent = (
    <>
      <Link href="/cart" className="ts-cart-icon-link" aria-label="Корзина">
        <svg
          className="ts-cart-icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M3 4H5L6.6 14.2C6.68 14.7 7.12 15.06 7.63 15.06H17.9C18.37 15.06 18.78 14.74 18.89 14.28L20.3 8.28C20.45 7.65 19.97 7.06 19.32 7.06H6.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="19" r="1.4" fill="currentColor" />
          <circle cx="17" cy="19" r="1.4" fill="currentColor" />
        </svg>
        <span className="ts-cart-icon-badge">
          {totalItems} · {totalPrice} ₽
        </span>
      </Link>
    </>
  );

  return (
    <header className="ts-nav">
      <div className="ts-nav-inner">
        <Link href="/menu" className="ts-logo">
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
        </div>
      </div>
    </header>
  );
}
