import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type SessionUser = { id:string; email:string; name:string; organizationId:string; role:"owner"|"admin"|"security_engineer"|"developer"|"viewer" };
const COOKIE="sentinel_session";
const secret=()=>new TextEncoder().encode(process.env.AUTH_SECRET ?? "development-only-change-me");
export function hashPassword(password:string,salt=randomBytes(16).toString("hex")){const hash=scryptSync(password,salt,64).toString("hex");return `${salt}:${hash}`}
export function verifyPassword(password:string,stored:string){const [salt,hash]=stored.split(":");if(!salt||!hash)return false;const candidate=scryptSync(password,salt,64);const expected=Buffer.from(hash,"hex");return candidate.length===expected.length&&timingSafeEqual(candidate,expected)}
export async function createSession(user:SessionUser){const token=await new SignJWT(user).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("8h").sign(secret());(await cookies()).set(COOKIE,token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*8})}
export async function destroySession(){(await cookies()).delete(COOKIE)}
export async function getSession():Promise<SessionUser|null>{const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;try{return (await jwtVerify(token,secret())).payload as unknown as SessionUser}catch{return null}}
export async function requireSession(){const session=await getSession();if(!session)throw new Error("UNAUTHENTICATED");return session}
export function verifyCsrf(token:string|undefined,sessionId:string){if(!token)return false;const expected=createHmac("sha256",process.env.AUTH_SECRET??"development-only-change-me").update(sessionId).digest("hex");return token.length===expected.length&&timingSafeEqual(Buffer.from(token),Buffer.from(expected))}
