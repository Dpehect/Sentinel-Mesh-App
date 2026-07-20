export interface Alert{severity:"low"|"medium"|"high"|"critical";type:string;}
export interface Playbook{name:string;matches:string[];actions:string[];}
export interface SoarDecision{playbook?:string;actions:string[];}

export function executePlaybooks(alert:Alert, playbooks:Playbook[]):SoarDecision{
 const pb=playbooks.find(p=>p.matches.includes(alert.type)||p.matches.includes(alert.severity));
 return pb?{playbook:pb.name,actions:pb.actions}:{actions:["notify-security-team"]};
}
