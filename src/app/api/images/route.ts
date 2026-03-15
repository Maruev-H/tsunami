import { NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

export const runtime = "nodejs";

type ImageBanSuccess = {
  data: {
    link: string;
    short_link?: string;
  }[];
  success: boolean;
  status: number;
};

export async function POST(request: Request) {
  const secret = process.env.IMAGEBAN_SECRET_KEY;

  if (!secret) {
    return NextResponse.json(
      { message: "IMAGEBAN_SECRET_KEY не настроен на сервере" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Ожидался JSON с полем url" },
      { status: 400 },
    );
  }

  const { url, album } = body as { url?: string; album?: string };

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { message: "Параметр url обязателен и должен быть строкой" },
      { status: 400 },
    );
  }

  const formData = new FormData();
  formData.append("url", url);
  if (album) {
    formData.append("album", album);
  }

  try {
    const response = await axios.post<ImageBanSuccess>("https://api.imageban.ru/v1", formData, {
      headers: {
        Authorization: `Bearer ${secret}`,
        ...(formData as any).getHeaders?.(),
      },
    });

    const first = response.data.data?.[0];

    if (!first?.link) {
      return NextResponse.json(
        { message: "Сервис не вернул ссылку на изображение", raw: response.data },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        link: first.link,
        shortLink: first.short_link ?? null,
      },
      { status: 200 },
    );
  } catch (error: any) {
    const message =
      error?.response?.data?.error?.message ??
      error?.message ??
      "Не удалось загрузить изображение";

    return NextResponse.json(
      {
        message,
        code: error?.response?.data?.error?.code ?? null,
      },
      { status: 400 },
    );
  }
}

