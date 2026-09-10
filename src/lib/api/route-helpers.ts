import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

/**
 * Lỗi có mã HTTP đi kèm — mọi lớp lỗi nghiệp vụ (RecordAttemptError,
 * ImportDeckError, VocabSessionError...) đều khớp interface này nên
 * toErrorResponse() xử lý được chung mà không cần biết lớp cụ thể.
 */
interface HttpAwareError extends Error {
  status: number;
}

function isHttpAwareError(err: unknown): err is HttpAwareError {
  return err instanceof Error && typeof (err as HttpAwareError).status === "number";
}

/**
 * Đổi exception thành response JSON.
 *
 * Lỗi nghiệp vụ (có `status`) là thông điệp viết cho người dùng nên trả nguyên
 * văn. Mọi lỗi còn lại là lỗi hệ thống — message của chúng có thể chứa tên
 * bảng/cột/constraint của Postgres, không nên đẩy ra ngoài; ghi log ở server và
 * chỉ trả thông báo chung.
 */
export function toErrorResponse(err: unknown): NextResponse {
  if (isHttpAwareError(err)) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[api] lỗi không lường trước:", err);
  return NextResponse.json(
    { error: "Có lỗi ở hệ thống, thử lại sau nhé." },
    { status: 500 }
  );
}

export interface RouteContext<P = object> {
  supabase: SupabaseClient<Database>;
  user: User;
  req: Request;
  params: P;
}

type Handler<P> = (ctx: RouteContext<P>) => Promise<NextResponse>;

/**
 * Bọc một route handler: tạo Supabase client, bắt buộc đăng nhập, và chuẩn hoá
 * xử lý lỗi.
 *
 * Dùng `auth.getUser()` chứ không phải `auth.getSession()`: getSession chỉ đọc
 * cookie và giải mã, không xác minh chữ ký JWT với Supabase — cookie giả mạo
 * vẫn qua được. Proxy (src/proxy.ts) hiện có chặn trước, nhưng route không nên
 * phụ thuộc vào đó: chỉ cần ai đó sửa `matcher` là toàn bộ API hở.
 */
export function withAuth<P = object>(handler: Handler<P>) {
  return async (req: Request, ctx: { params: Promise<P> }): Promise<NextResponse> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    try {
      const params = (ctx?.params ? await ctx.params : ({} as P)) as P;
      return await handler({ supabase, user, req, params });
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

/**
 * Đọc body JSON, ném lỗi 400 thay vì để handler tự kiểm tra null.
 * Giới hạn kích thước để một lần dán nhầm file khổng lồ không làm hết RAM của
 * serverless function.
 */
export const MAX_JSON_BODY_BYTES = 2 * 1024 * 1024; // 2 MB

export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  const declaredSize = Number(req.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_JSON_BODY_BYTES) {
    throw new BadRequestError("Nội dung gửi lên quá lớn (tối đa 2 MB).");
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Body JSON không hợp lệ.");
  }
  return body as Record<string, unknown>;
}

export class BadRequestError extends Error {
  status = 400;
}
