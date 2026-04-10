import { NextRequest, NextResponse } from "next/server";
import {
  clearDemoSessionCookie,
  getDemoSessionCookie,
  isSupabaseConfigured,
} from "@/lib/auth/session";
import { createPendingDemoUser } from "@/lib/demo/portal-users";
import { createServerClient } from "@/lib/supabase/server-client";

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const route = path.join("/");

  try {
    if (route === "login") {
      return await handleLogin(request);
    }

    if (route === "signup") {
      return await handleSignup(request);
    }

    if (route === "logout") {
      return await handleLogout();
    }

    if (route === "reset-password") {
      return await handleResetPassword(request);
    }

    return NextResponse.json({ error: `Route /api/auth/${route} not found` }, { status: 404 });
  } catch {
    return NextResponse.json(
      { error: "Unable to complete this request right now." },
      { status: 500 },
    );
  }
}

async function handleLogin(request: NextRequest) {
  const body = await readRequestBody(request);
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    const response = NextResponse.json({
      success: true,
      user: { id: "demo-user", email },
      message: "Demo mode - login successful",
    });

    const demoSession = getDemoSessionCookie(email);
    response.cookies.set(demoSession.name, demoSession.value, demoSession.options);
    return response;
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ success: true, user: data.user, session: data.session });
}

async function handleSignup(request: NextRequest) {
  const body = await readRequestBody(request);
  const { email, fullName, phone, city, password } = body;

  if (!email || !fullName || !password) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    await createPendingDemoUser({
      city: city ?? "",
      email,
      fullName,
      phone: phone ?? "",
    });

    return NextResponse.json({
      success: true,
      message: "Account created. Pending approval. (Demo mode)",
      user: { id: email, email, user_metadata: { full_name: fullName } },
    });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        city,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "Account created. Pending approval.",
    user: data.user,
  });
}

async function handleLogout() {
  if (!isSupabaseConfigured()) {
    const response = NextResponse.json({ success: true, message: "Logged out (Demo mode)" });
    const clearedSession = clearDemoSessionCookie();
    response.cookies.set(clearedSession.name, clearedSession.value, clearedSession.options);
    return response;
  }

  const supabase = await createServerClient();
  await supabase.auth.signOut();

  const response = NextResponse.json({ success: true, message: "Logged out" });
  const clearedSession = clearDemoSessionCookie();
  response.cookies.set(clearedSession.name, clearedSession.value, clearedSession.options);
  return response;
}

async function handleResetPassword(request: NextRequest) {
  const body = await readRequestBody(request);
  const { email, locale } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: true,
      message: "If the account exists, a reset link will be sent. (Demo mode)",
    });
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${request.nextUrl.origin}/${locale === "hi" ? "hi" : "en"}/login`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "If the account exists, a reset link will be sent.",
  });
}

async function readRequestBody(request: NextRequest): Promise<Record<string, string>> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
