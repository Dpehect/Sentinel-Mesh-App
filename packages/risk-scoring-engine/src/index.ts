export interface RiskSignal{category:string;score:number;}
export interface RiskResult{score:number;level:"LOW"|"MEDIUM"|"HIGH"|"CRITICAL";}
export function calculateEnterpriseRisk(signals:RiskSignal[]):RiskResult{
 const score=Math.max(0,Math.min(100,Math.round(signals.reduce((a,b)=>a+b.score,0)/Math.max(signals.length,1))));
 const level=score>=90?"CRITICAL":score>=70?"HIGH":score>=40?"MEDIUM":"LOW";
 return {score,level};
}
