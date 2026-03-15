import { NextResponse } from "next/server";
import { readMenu, writeMenu } from "../../../lib/menuStore";
import type { MenuData } from "../../../lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await readMenu();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Не удалось загрузить меню", error: String(error) },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as MenuData;
    await writeMenu(body);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Не удалось сохранить меню", error: String(error) },
      { status: 400 },
    );
  }
}

