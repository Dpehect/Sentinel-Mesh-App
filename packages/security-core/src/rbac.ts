export type Role="owner"|"admin"|"security_engineer"|"developer"|"viewer";
export type Permission="project:read"|"project:write"|"scan:run"|"finding:triage"|"policy:write"|"member:manage"|"audit:read";
const map:Record<Role,Permission[]>={owner:["project:read","project:write","scan:run","finding:triage","policy:write","member:manage","audit:read"],admin:["project:read","project:write","scan:run","finding:triage","policy:write","member:manage","audit:read"],security_engineer:["project:read","project:write","scan:run","finding:triage","policy:write","audit:read"],developer:["project:read","scan:run","finding:triage"],viewer:["project:read"]};
export const can=(role:Role,p:Permission)=>map[role].includes(p);
export function assertTenant(userTenant:string,resourceTenant:string){if(userTenant!==resourceTenant) throw new Error("Cross-tenant access denied");}
