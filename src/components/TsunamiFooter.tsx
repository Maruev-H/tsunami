import Link from "next/link";

export function TsunamiFooter() {
  return (
    <footer className="ts-footer">
      <div className="ts-footer-inner">
        <div className="ts-footer-row">
          <span>© {new Date().getFullYear()} Tsunami. Все права защищены.</span>
          <div className="ts-footer-links">
            <span className="ts-footer-link">Гудермес, ул. Бисаева, 41</span>
            <a className="ts-footer-link" href="tel:+79289449393">
              +7 928 944-93-93
            </a>
          </div>
        </div>
        <div className="ts-footer-meta">
          <span>Часы работы: ежедневно с 11:00 до 23:00</span>
          <span>Онлайн-заказ через WhatsApp</span>
          <Link href="/admin" className="ts-footer-link">
            Вход для админов
          </Link>
        </div>
      </div>
    </footer>
  );
}

