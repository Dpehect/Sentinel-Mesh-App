import { can, assertTenant, type Permission } from "@sentinel/security-core";
import { requireSession } from "./auth";
export async function authorize(permission:Permission,resourceTenant?:string){const session=await requireSession();if(resourceTenant)assertTenant(session.organizationId,resourceTenant);if(!can(session.role,permission))throw new Error("FORBIDDEN");return session}
