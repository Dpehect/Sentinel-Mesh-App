import {createHash} from "node:crypto";
import type {
  AdvancedBehaviorEvent,
  AdvancedBehaviorProfile,
  AdvancedUebaFinding,
  AdvancedUebaReport,
  AdvancedUebaSeverity,
  PeerGroupMetric
} from "./types.js";

export type {
  AdvancedBehaviorEvent,
  AdvancedBehaviorProfile,
  AdvancedUebaFinding,
  AdvancedUebaReport,
  AdvancedUebaSeverity,
  PeerGroupMetric
} from "./types.js";

function finding(
  entityId:string,
  ruleId:string,
  severity:AdvancedUebaSeverity,
  score:number,
  title:string,
  events:AdvancedBehaviorEvent[],
  reasons:string[]
):AdvancedUebaFinding {
  const ids = [...new Set(events.map(event=>event.id))];
  const hash = createHash("sha256")
    .update(`${entityId}|${ruleId}|${ids.join("|")}`)
    .digest("hex");

  return {
    id:`ueba2_${hash.slice(0,16)}`,
    entityId,ruleId,severity,
    score:Math.max(0,Math.min(100,score)),
    title,
    evidenceEventIds:ids,
    reasons:[...new Set(reasons)]
  };
}

function haversineKm(
  lat1:number, lon1:number, lat2:number, lon2:number
):number {
  const toRad = (value:number)=>value*Math.PI/180;
  const radius = 6371;
  const dLat = toRad(lat2-lat1);
  const dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2*radius*Math.asin(Math.sqrt(a));
}

export function analyzeAdvancedBehavior(
  profiles:AdvancedBehaviorProfile[],
  events:AdvancedBehaviorEvent[],
  peerMetrics:PeerGroupMetric[],
  now = new Date()
):AdvancedUebaReport {
  const profileByEntity = new Map(profiles.map(item=>[item.entityId,item]));
  const findings:AdvancedUebaFinding[] = [];
  const eventsByEntity = new Map<string,AdvancedBehaviorEvent[]>();

  for (const event of events) {
    eventsByEntity.set(event.entityId,[
      ...(eventsByEntity.get(event.entityId) ?? []),
      event
    ]);
  }

  for (const [entityId,entityEvents] of eventsByEntity) {
    const profile = profileByEntity.get(entityId);
    const sorted = [...entityEvents].sort((a,b)=>
      new Date(a.timestamp).getTime()-new Date(b.timestamp).getTime()
    );

    if (!profile) {
      findings.push(finding(
        entityId,"UEBA2-BASELINE-001","medium",55,
        "Entity has no established advanced baseline",
        sorted,["NO_BASELINE"]
      ));
      continue;
    }

    if (profile.lastActiveAt) {
      const dormantDays = (
        now.getTime()-new Date(profile.lastActiveAt).getTime()
      )/(24*60*60*1000);

      if (dormantDays >= 60 && sorted.length > 0) {
        findings.push(finding(
          entityId,"UEBA2-DORMANT-001",
          profile.privileged ? "critical" : "high",
          profile.privileged ? 94 : 78,
          "Dormant identity became active",
          [sorted[0]],
          [`DORMANT_DAYS_${Math.floor(dormantDays)}`]
        ));
      }
    }

    for (let index=1; index<sorted.length; index+=1) {
      const previous = sorted[index-1];
      const current = sorted[index];

      if (
        previous.latitude !== undefined &&
        previous.longitude !== undefined &&
        current.latitude !== undefined &&
        current.longitude !== undefined
      ) {
        const distance = haversineKm(
          previous.latitude,previous.longitude,
          current.latitude,current.longitude
        );
        const hours = (
          new Date(current.timestamp).getTime()-
          new Date(previous.timestamp).getTime()
        )/(60*60*1000);

        if (hours > 0 && distance/hours > 900) {
          findings.push(finding(
            entityId,"UEBA2-TRAVEL-001","critical",96,
            "Impossible travel detected",
            [previous,current],
            [`DISTANCE_KM_${Math.round(distance)}`,`HOURS_${hours.toFixed(2)}`]
          ));
        }
      }
    }

    const actionCounts = new Map<string,number>();
    for (const event of sorted) {
      actionCounts.set(event.action,(actionCounts.get(event.action) ?? 0)+1);
    }

    for (const [action,count] of actionCounts) {
      const metric = peerMetrics.find(item=>
        item.peerGroup===profile.peerGroup && item.action===action
      );

      if (metric && metric.averagePerEntity > 0 && count >= metric.averagePerEntity*5) {
        findings.push(finding(
          entityId,"UEBA2-PEER-001",
          count >= metric.averagePerEntity*10 ? "critical" : "high",
          count >= metric.averagePerEntity*10 ? 92 : 80,
          "Entity behavior significantly exceeds peer group",
          sorted.filter(event=>event.action===action),
          [`ACTION_${action}`,`PEER_MULTIPLIER_${(count/metric.averagePerEntity).toFixed(1)}`]
        ));
      }
    }

    const failedLogins = sorted.filter(event=>
      event.action==="login" && event.success===false
    );
    const successfulLogin = sorted.find(event=>
      event.action==="login" && event.success===true
    );
    const privilegedAction = sorted.find(event=>
      event.privileged===true &&
      ["role-assignment","credential-reset","data-export","policy-change"].includes(event.action)
    );

    if (
      failedLogins.length >= 3 &&
      successfulLogin &&
      privilegedAction &&
      new Date(privilegedAction.timestamp).getTime()-
      new Date(successfulLogin.timestamp).getTime() <= 30*60*1000
    ) {
      findings.push(finding(
        entityId,"UEBA2-SEQUENCE-001","critical",98,
        "Suspicious authentication-to-privilege sequence",
        [...failedLogins,successfulLogin,privilegedAction],
        ["MULTIPLE_FAILED_LOGINS","SUCCESSFUL_LOGIN","PRIVILEGED_ACTION"]
      ));
    }

    const transfers = sorted.filter(event=>(event.dataTransferMb ?? 0)>0);
    const totalTransfer = transfers.reduce(
      (sum,event)=>sum+(event.dataTransferMb ?? 0),0
    );

    if (
      profile.averageDataTransferMb > 0 &&
      totalTransfer >= profile.averageDataTransferMb*8
    ) {
      findings.push(finding(
        entityId,"UEBA2-DATA-001",
        totalTransfer >= profile.averageDataTransferMb*15 ? "critical" : "high",
        totalTransfer >= profile.averageDataTransferMb*15 ? 95 : 83,
        "Entity transferred abnormal data volume",
        transfers,
        [`TOTAL_MB_${Math.round(totalTransfer)}`]
      ));
    }

    const countries = new Set(
      sorted.map(event=>event.country).filter((value):value is string=>Boolean(value))
    );
    if (
      countries.size >= 3 &&
      [...countries].some(country=>!profile.usualCountries.includes(country))
    ) {
      findings.push(finding(
        entityId,"UEBA2-GEO-001","high",82,
        "Rapid multi-country activity detected",
        sorted.filter(event=>event.country!==undefined),
        [`COUNTRIES_${[...countries].join(",")}`]
      ));
    }
  }

  const deduped = [...new Map(findings.map(item=>[item.id,item])).values()];
  const highestScore = deduped.reduce(
    (highest,item)=>Math.max(highest,item.score),0
  );
  const entitiesToContain = [...new Set(
    deduped.filter(item=>item.score>=90).map(item=>item.entityId)
  )];

  return {
    entitiesAnalyzed:eventsByEntity.size,
    eventsAnalyzed:events.length,
    findings:deduped.sort((a,b)=>b.score-a.score),
    highestScore,
    entitiesToContain,
    decision:entitiesToContain.length > 0
      ? "contain"
      : highestScore >= 70
        ? "investigate"
        : "allow"
  };
}

export function createAdvancedUebaSummary(report:AdvancedUebaReport):string {
  return [
    `UEBA 2.0 decision: ${report.decision}`,
    `Entities analyzed: ${report.entitiesAnalyzed}`,
    `Events analyzed: ${report.eventsAnalyzed}`,
    `Findings: ${report.findings.length}`,
    `Entities to contain: ${report.entitiesToContain.length}`
  ].join("\n");
}
