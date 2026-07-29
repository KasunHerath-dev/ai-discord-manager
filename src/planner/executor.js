import path from "node:path";
import { discord } from "../discord/service.js";
import { assertExecutable } from "./safety.js";
import { savePlan } from "./plans.js";
import { writeJson, readJson } from "../storage.js";
import { BACKUPS_DIR, AUDIT_FILE } from "../config.js";

async function audit(entry) {
  const all = await readJson(AUDIT_FILE, []);
  all.unshift(entry);
  await writeJson(AUDIT_FILE, all.slice(0, 2000));
}

/**
 * Enhanced operation state with rate-limit and retry information
 */
function createOperationState(action) {
  return {
    actionId: action.id,
    actionType: action.type,
    targetName: action.name,
    targetId: action.targetId || null,
    status: "pending", // pending | running | waiting_rate_limit | completed | failed | skipped
    retryCount: 0,
    errorMessage: null,
    resultMessage: null,
    startedAt: null,
    completedAt: null,
  };
}

/**
 * Update or create operation state in plan
 */
function updateOperationState(plan, actionId, updates) {
  let opStates = plan.operationStates || [];
  let opState = opStates.find(o => o.actionId === actionId);
  
  if (!opState) {
    opState = { actionId };
    opStates.push(opState);
  }
  
  Object.assign(opState, updates);
  
  return { ...plan, operationStates: opStates };
}

/**
 * Get operation state from plan
 */
function getOperationState(plan, actionId) {
  return (plan.operationStates || []).find(o => o.actionId === actionId);
}

/**
 * Execute a plan with enhanced rate-limit handling and operation state tracking
 */
export async function executePlan(plan, confirmation) {
  assertExecutable(plan, confirmation);
  
  const now = () => new Date().toISOString();
  const stamp = now().replace(/[:.]/g, "-");
  
  // Take pre-action snapshot
  await writeJson(path.join(BACKUPS_DIR, `${stamp}-${plan.id}.json`), await discord.snapshot());
  
  // Initialize plan with execution tracking
  let p = {
    ...plan,
    status: "executing",
    updatedAt: now(),
    executionLog: [
      ...plan.executionLog,
      { at: now(), level: "info", message: "Pre-action server snapshot saved." }
    ],
    operationStates: plan.operationStates || [],
    executionStats: {
      total: plan.actions.length,
      completed: 0,
      failed: 0,
      skipped: 0,
      retried: 0,
    }
  };
  
  await savePlan(p);

  // Execute each action
  for (const action of p.actions) {
    const opState = getOperationState(p, action.id);
    
    // Skip already completed actions
    if (opState && opState.status === "completed") {
      console.log(`[Executor] Skipping already completed action: ${action.id}`);
      continue;
    }
    
    try {
      // Mark as running
      p = updateOperationState(p, action.id, {
        status: "running",
        startedAt: now(),
        retryCount: (opState?.retryCount || 0)
      });
      
      p = {
        ...p,
        updatedAt: now(),
        executionLog: [
          ...p.executionLog,
          { at: now(), actionId: action.id, level: "info", message: `Executing: ${action.type} ${action.name || action.targetId || ''}` }
        ]
      };
      
      await savePlan(p);
      
      // Execute the action
      const message = await discord.execute(action);
      
      // Mark as completed
      p = updateOperationState(p, action.id, {
        status: "completed",
        resultMessage: message,
        completedAt: now()
      });
      
      p.executionStats.completed++;
      p = {
        ...p,
        updatedAt: now(),
        executionLog: [
          ...p.executionLog,
          { at: now(), actionId: action.id, level: "success", message }
        ]
      };
      
      await audit({
        at: now(),
        planId: p.id,
        actionId: action.id,
        event: "success",
        detail: message
      });
      
      await savePlan(p);
      
    } catch (error) {
      const message = error.message || String(error);
      
      // Check if this is a permanent error or temporary
      const isPermanent = 
        message.includes("401") ||  // Unauthorized
        message.includes("403") ||  // Forbidden
        message.includes("404") ||  // Not Found
        message.includes("not found") ||
        message.includes("unknown");
      
      if (isPermanent) {
        // Mark as failed (permanent)
        p = updateOperationState(p, action.id, {
          status: "failed",
          errorMessage: message,
          completedAt: now()
        });
        
        p.executionStats.failed++;
        p = {
          ...p,
          status: "failed",
          updatedAt: now(),
          executionLog: [
            ...p.executionLog,
            { at: now(), actionId: action.id, level: "error", message }
          ]
        };
        
        await audit({
          at: now(),
          planId: p.id,
          actionId: action.id,
          event: "failed",
          detail: message
        });
        
        await savePlan(p);
        return p;
      } else {
        // Temporary error (rate limit, server error)
        // The API will handle retry, so we just need to track it
        const retryCount = (opState?.retryCount || 0) + 1;
        
        if (message.includes("429")) {
          // Rate limit - this will be retried by the API
          p = updateOperationState(p, action.id, {
            status: "waiting_rate_limit",
            retryCount,
            errorMessage: message
          });
          
          p.executionStats.retried++;
          p = {
            ...p,
            updatedAt: now(),
            executionLog: [
              ...p.executionLog,
              { at: now(), actionId: action.id, level: "warning", message: `Rate limited. Waiting and retrying... (attempt ${retryCount})` }
            ]
          };
          
          await savePlan(p);
          
          // The call() method will handle the retry, so we continue the loop
          // to attempt the same action again
          throw error;
        } else {
          // Other temporary error
          p = updateOperationState(p, action.id, {
            status: "failed",
            retryCount,
            errorMessage: message,
            completedAt: now()
          });
          
          p.executionStats.failed++;
          p = {
            ...p,
            status: "failed",
            updatedAt: now(),
            executionLog: [
              ...p.executionLog,
              { at: now(), actionId: action.id, level: "error", message }
            ]
          };
          
          await audit({
            at: now(),
            planId: p.id,
            actionId: action.id,
            event: "failed",
            detail: message
          });
          
          await savePlan(p);
          return p;
        }
      }
    }
  }

  // Mark plan as successfully executed
  p = {
    ...p,
    status: "executed",
    updatedAt: now(),
    executionLog: [
      ...p.executionLog,
      {
        at: now(),
        level: "success",
        message: `Plan completed. Completed: ${p.executionStats.completed}, Failed: ${p.executionStats.failed}, Skipped: ${p.executionStats.skipped}, Retried: ${p.executionStats.retried}`
      }
    ]
  };
  
  await savePlan(p);
  return p;
}
