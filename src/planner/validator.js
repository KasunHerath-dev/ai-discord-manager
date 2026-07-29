/**
 * Plan validation: ensures concrete operations and resource completeness
 */

// Generic placeholder names that should be rejected
const GENERIC_PLACEHOLDERS = new Set([
  "target",
  "role",
  "category",
  "channel",
  "project role",
  "project category",
  "project channel",
  "project roles hierarchy",
  "project categories",
  "project channels",
  "create project roles hierarchy",
  "create project categories",
  "create project channels",
  "all roles",
  "all channels",
  "roles hierarchy",
  "channels group",
]);

/**
 * Check if a name is a generic placeholder
 */
export function isGenericPlaceholder(name) {
  if (!name) return false;
  const lower = String(name).toLowerCase().trim();
  return GENERIC_PLACEHOLDERS.has(lower);
}

/**
 * Count expected resources from a user prompt
 * Returns { roles, categories, textChannels, voiceChannels }
 */
export function countExpectedResources(prompt) {
  if (!prompt) return { roles: 0, categories: 0, textChannels: 0, voiceChannels: 0 };

  const text = prompt.toLowerCase();
  
  // Count role mentions: "X role[s]", "role[s] for X", specific role names
  let roleCount = 0;
  const roleMatches = text.match(/(\d+)\s*role/gi) || [];
  roleMatches.forEach(m => {
    const num = parseInt(m.match(/\d+/)?.[0] || "0");
    roleCount += num;
  });

  // Also count role lines that start with "- " or are numbered with specific role names
  const lines = prompt.split('\n');
  const roleLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    // Check for role-specific markers
    if (trimmed.startsWith('-') && trimmed.length > 2 && !lower.includes('permission') && !lower.includes('channel') && !lower.includes('category')) {
      return true;
    }
    // Check for numbered role listings
    if (/^\d+\.\s+[A-Z]/.test(trimmed) && !lower.includes('categor') && !lower.includes('channel')) {
      return true;
    }
    return false;
  });
  
  if (roleLines.length > roleCount && roleLines.length < 100) {
    roleCount = roleLines.length;
  }

  // Count categories: "X categor", category structures
  let categoryCount = 0;
  const catMatches = text.match(/(\d+)\s*categor/gi) || [];
  catMatches.forEach(m => {
    const num = parseInt(m.match(/\d+/)?.[0] || "0");
    categoryCount += num;
  });

  // Also count numbered category listings
  const categoryLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    if (/^\d+\.\s+/.test(trimmed) && (lower.includes('categor') || /^[0-9]+\.\s+[A-Z][A-Z\s\—\-]+$/.test(trimmed))) {
      return true;
    }
    return false;
  });
  
  if (categoryLines.length > categoryCount) {
    categoryCount = categoryLines.length;
  }

  // Count text channels: explicit channel names and "X text channel[s]"
  let textChannelCount = 0;
  const textMatches = text.match(/(\d+)\s*text\s+channel/gi) || [];
  textMatches.forEach(m => {
    const num = parseInt(m.match(/\d+/)?.[0] || "0");
    textChannelCount += num;
  });

  // Count voice channels: "X voice channel[s]"
  let voiceChannelCount = 0;
  const voiceMatches = text.match(/(\d+)\s*voice\s+channel/gi) || [];
  voiceMatches.forEach(m => {
    const num = parseInt(m.match(/\d+/)?.[0] || "0");
    voiceChannelCount += num;
  });

  // Fallback: count common channel names (approximation)
  if ((textChannelCount === 0 || voiceChannelCount === 0) && categoryCount > 0) {
    const channelLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('-') && !trimmed.toLowerCase().includes('role') && !trimmed.toLowerCase().includes('permission') && !trimmed.toLowerCase().includes('categor');
    });
    
    if (textChannelCount === 0) {
      // Count lines that look like text channels (no Voice prefix)
      textChannelCount = channelLines.filter(l => !l.toLowerCase().includes('voice')).length;
    }
    if (voiceChannelCount === 0) {
      // Count lines that explicitly mention voice
      voiceChannelCount = channelLines.filter(l => l.toLowerCase().includes('voice')).length;
    }
  }

  return { roles: roleCount, categories: categoryCount, textChannels: textChannelCount, voiceChannels: voiceChannelCount };
}

/**
 * Count actions by type in a plan
 */
export function countActionsByType(actions) {
  const counts = {};
  (actions || []).forEach(a => {
    if (!counts[a.type]) counts[a.type] = 0;
    counts[a.type]++;
  });
  return counts;
}

/**
 * Check if plan has sufficient operations for the expected resources
 */
export function validateResourceCompleteness(prompt, plan) {
  const expected = countExpectedResources(prompt);
  const actionCounts = countActionsByType(plan.actions);

  const issues = [];

  // If we expected roles, we must have CREATE_ROLE operations
  if (expected.roles > 0) {
    const created = (actionCounts["CREATE_ROLE"] || 0) + (actionCounts["UPDATE_ROLE"] || 0);
    if (created === 0) {
      issues.push(`Expected approximately ${expected.roles} role operations but received 0.`);
    } else if (created === 1 && expected.roles > 1) {
      issues.push(`Expected approximately ${expected.roles} role operations but received only 1.`);
    }
  }

  // If we expected categories, we must have CREATE_CATEGORY operations
  if (expected.categories > 0) {
    const created = (actionCounts["CREATE_CATEGORY"] || 0) + (actionCounts["UPDATE_CATEGORY"] || 0);
    if (created === 0) {
      issues.push(`Expected approximately ${expected.categories} category operations but received 0.`);
    } else if (created === 1 && expected.categories > 1) {
      issues.push(`Expected approximately ${expected.categories} category operations but received only 1.`);
    }
  }

  // If we expected text channels, we must have text channel operations
  if (expected.textChannels > 0) {
    const created = (actionCounts["CREATE_TEXT_CHANNEL"] || 0) + (actionCounts["UPDATE_CHANNEL"] || 0);
    if (created === 0) {
      issues.push(`Expected approximately ${expected.textChannels} text channel operations but received 0.`);
    } else if (created === 1 && expected.textChannels > 1) {
      issues.push(`Expected approximately ${expected.textChannels} text channel operations but received only 1.`);
    }
  }

  // If we expected voice channels, we must have voice channel operations
  if (expected.voiceChannels > 0) {
    const created = (actionCounts["CREATE_VOICE_CHANNEL"] || 0);
    if (created === 0) {
      issues.push(`Expected approximately ${expected.voiceChannels} voice channel operations but received 0.`);
    } else if (created === 1 && expected.voiceChannels > 1) {
      issues.push(`Expected approximately ${expected.voiceChannels} voice channel operations but received only 1.`);
    }
  }

  return issues;
}

/**
 * Validate that action names are not generic placeholders
 */
export function validateActionNames(actions) {
  const issues = [];

  for (const action of actions || []) {
    const nameField = action.name || action.roleName || action.targetId;
    
    if (nameField && isGenericPlaceholder(nameField)) {
      issues.push(`Action ${action.id} uses generic placeholder "${nameField}" instead of a specific resource name.`);
    }

    // Check parent category reference is specific
    if (action.categoryName && isGenericPlaceholder(action.categoryName)) {
      issues.push(`Action ${action.id} references generic category name "${action.categoryName}".`);
    }
  }

  return issues;
}

/**
 * Validate dependency references exist in plan
 */
export function validateReferences(actions) {
  const issues = [];
  
  // Build map of action IDs and created resource names
  const roleNames = new Set();
  const categoryNames = new Set();
  const channelNames = new Set();

  for (const action of actions || []) {
    if (action.type === "CREATE_ROLE" && action.name) {
      roleNames.add(action.name);
    }
    if (action.type === "CREATE_CATEGORY" && action.name) {
      categoryNames.add(action.name);
    }
    if ((action.type === "CREATE_TEXT_CHANNEL" || action.type === "CREATE_VOICE_CHANNEL") && action.name) {
      channelNames.add(action.name);
    }
  }

  // Check that references point to valid resources
  for (const action of actions || []) {
    // Check category references
    if (action.categoryName && !categoryNames.has(action.categoryName)) {
      issues.push(`Action ${action.id} references category "${action.categoryName}" that is not created in this plan.`);
    }

    // Check role references in permission overwrites
    if (action.permissionOverwrites) {
      for (const overwrite of action.permissionOverwrites) {
        if (overwrite.roleName && overwrite.roleName !== "@everyone" && !roleNames.has(overwrite.roleName)) {
          issues.push(`Action ${action.id} references role "${overwrite.roleName}" that is not created in this plan.`);
        }
      }
    }

    // Check channel name in SEND_MESSAGE
    if (action.type === "SEND_MESSAGE" && action.name && !channelNames.has(action.name)) {
      issues.push(`Action ${action.id} targets channel "${action.name}" that is not created in this plan.`);
    }
  }

  return issues;
}

/**
 * Comprehensive plan validation
 */
export function validatePlan(prompt, plan) {
  const issues = [];

  // Check for generic placeholder names
  const nameIssues = validateActionNames(plan.actions);
  issues.push(...nameIssues);

  // Check resource count expectations
  const completenessIssues = validateResourceCompleteness(prompt, plan);
  issues.push(...completenessIssues);

  // Check that references are valid
  const refIssues = validateReferences(plan.actions);
  issues.push(...refIssues);

  return issues;
}
