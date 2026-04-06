import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await loginUser(email, password);

    if (!result.success) {
      if (result.code === "AUTH_SCHEMA_MISSING") {
        return NextResponse.json(
          { error: result.error, code: result.code },
          { status: 503 }
        );
      }

      if (result.code === "AUTH_UNEXPECTED") {
        return NextResponse.json(
          { error: result.error, code: result.code },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
