import { ReactNode } from "react";
import { TsunamiHeader } from "./TsunamiHeader";
import { TsunamiFooter } from "./TsunamiFooter";

type MainShellProps = {
  children: ReactNode;
};

export function MainShell({ children }: MainShellProps) {
  return (
    <div className="app-root">
      <TsunamiHeader />
      <main className="ts-layout-main">
        <div className="ts-container">{children}</div>
      </main>
      <TsunamiFooter />
    </div>
  );
}

