import { NextRequest, NextResponse } from "next/server";
const protectedPrefixes=["/dashboard","/projects","/scans","/findings","/attack-paths","/remediation","/github","/settings"];
export function proxy(req:NextRequest){if(!protectedPrefixes.some(x=>req.nextUrl.pathname.startsWith(x)))return NextResponse.next();if(!req.cookies.get("sentinel_session")){const url=req.nextUrl.clone();url.pathname="/login";url.searchParams.set("next",req.nextUrl.pathname);return NextResponse.redirect(url)}return NextResponse.next()}
export const config={matcher:["/dashboard/:path*","/projects/:path*","/scans/:path*","/findings/:path*","/attack-paths/:path*","/remediation/:path*","/github/:path*","/settings/:path*"]};
