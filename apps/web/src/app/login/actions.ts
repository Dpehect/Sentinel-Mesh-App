"use server";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
export async function login(formData:FormData){const email=String(formData.get("email")??"").trim().toLowerCase();const password=String(formData.get("password")??"");const allowedEmail=process.env.DEMO_ADMIN_EMAIL??"admin@sentinel.local";const allowedPassword=process.env.DEMO_ADMIN_PASSWORD??"Sentinel123!";if(email!==allowedEmail||password!==allowedPassword)redirect("/login?error=invalid");await createSession({id:"demo-admin",email,name:"Sentinel Admin",organizationId:"demo-org",role:"owner"});redirect("/dashboard")}
