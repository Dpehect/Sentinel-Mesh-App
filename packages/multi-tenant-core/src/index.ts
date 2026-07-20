export type TenantStatus="active"|"suspended"|"archived";
export type TenantRole="owner"|"admin"|"analyst"|"viewer"|"service";
export interface Tenant{id:string;name:string;status:TenantStatus;dataRegion:string;}
export interface Membership{tenantId:string;principalId:string;role:TenantRole;active:boolean;}
export interface TenantResource{id:string;tenantId:string;type:string;}
export interface TenantQuota{tenantId:string;assets:number;users:number;eventsPerDay:number;storageMb:number;}
export interface TenantUsage{tenantId:string;assets:number;users:number;eventsToday:number;storageMb:number;}
export interface IsolationReport{crossTenantReferences:string[];quotaViolations:string[];suspendedAccess:string[];decision:"healthy"|"review"|"block";}

const permissions:Record<TenantRole,string[]>={
 owner:["tenant:*","security:*","billing:*"],
 admin:["security:*","tenant:read","tenant:member-manage"],
 analyst:["security:read","security:investigate","security:respond"],
 viewer:["security:read"],service:["security:ingest"]
};
function matches(granted:string,requested:string){return granted===requested||(granted.endsWith(":*")&&requested.startsWith(granted.slice(0,-1)));}

export function authorizeTenantAction(tenant:Tenant,membership:Membership|undefined,permission:string){
 if(tenant.status!=="active")return{allowed:false,reason:"TENANT_NOT_ACTIVE"};
 if(!membership||!membership.active)return{allowed:false,reason:"ACTIVE_MEMBERSHIP_REQUIRED"};
 if(membership.tenantId!==tenant.id)return{allowed:false,reason:"CROSS_TENANT_MEMBERSHIP"};
 return permissions[membership.role].some(item=>matches(item,permission))
  ?{allowed:true}:{allowed:false,reason:"PERMISSION_DENIED"};
}
export function assertTenantResourceAccess(tenantId:string,resource:TenantResource){
 if(resource.tenantId!==tenantId)throw new Error("CROSS_TENANT_RESOURCE_ACCESS");
}
export function evaluateTenantQuota(quota:TenantQuota,usage:TenantUsage){
 if(quota.tenantId!==usage.tenantId)return["QUOTA_USAGE_TENANT_MISMATCH"];
 const v:string[]=[];
 if(usage.assets>quota.assets)v.push("ASSET_QUOTA_EXCEEDED");
 if(usage.users>quota.users)v.push("USER_QUOTA_EXCEEDED");
 if(usage.eventsToday>quota.eventsPerDay)v.push("EVENT_QUOTA_EXCEEDED");
 if(usage.storageMb>quota.storageMb)v.push("STORAGE_QUOTA_EXCEEDED");
 return v;
}
export function validateTenantIsolation(
 tenants:Tenant[],memberships:Membership[],resources:TenantResource[],
 refs:Array<{fromResourceId:string;toResourceId:string}>,
 quotas:TenantQuota[],usages:TenantUsage[]
):IsolationReport{
 const byResource=new Map(resources.map(r=>[r.id,r]));
 const byTenant=new Map(tenants.map(t=>[t.id,t]));
 const crossTenantReferences=refs.flatMap(ref=>{
  const a=byResource.get(ref.fromResourceId),b=byResource.get(ref.toResourceId);
  return a&&b&&a.tenantId!==b.tenantId?[`${ref.fromResourceId}->${ref.toResourceId}`]:[];
 });
 const quotaViolations=quotas.flatMap(q=>{
  const u=usages.find(x=>x.tenantId===q.tenantId);
  return u?evaluateTenantQuota(q,u).map(v=>`${q.tenantId}:${v}`):[];
 });
 const suspendedAccess=memberships.flatMap(m=>{
  const t=byTenant.get(m.tenantId);
  return t&&t.status!=="active"&&m.active?[`${t.id}:${m.principalId}`]:[];
 });
 return{crossTenantReferences,quotaViolations,suspendedAccess,
 decision:crossTenantReferences.length||suspendedAccess.length?"block":quotaViolations.length?"review":"healthy"};
}
export function filterTenantResources<T extends TenantResource>(tenantId:string,resources:T[]):T[]{
 return resources.filter(resource=>resource.tenantId===tenantId);
}
