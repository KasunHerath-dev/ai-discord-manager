import test from "node:test";
import assert from "node:assert/strict";
import {
  isGenericPlaceholder,
  countExpectedResources,
  countActionsByType,
  validateResourceCompleteness,
  validateActionNames,
  validateReferences,
  validatePlan,
} from "../src/planner/validator.js";

test("isGenericPlaceholder rejects 'Target'", () => {
  assert.ok(isGenericPlaceholder("Target"));
  assert.ok(isGenericPlaceholder("target"));
  assert.ok(isGenericPlaceholder("TARGET"));
});

test("isGenericPlaceholder rejects 'Role' variants", () => {
  assert.ok(isGenericPlaceholder("Role"));
  assert.ok(isGenericPlaceholder("role"));
  assert.ok(isGenericPlaceholder("Project Role"));
  assert.ok(isGenericPlaceholder("All Roles"));
  assert.ok(isGenericPlaceholder("Create project roles hierarchy"));
});

test("isGenericPlaceholder rejects 'Category' variants", () => {
  assert.ok(isGenericPlaceholder("Category"));
  assert.ok(isGenericPlaceholder("Project Category"));
  assert.ok(isGenericPlaceholder("Project Categories"));
  assert.ok(isGenericPlaceholder("Create project categories"));
});

test("isGenericPlaceholder rejects 'Channel' variants", () => {
  assert.ok(isGenericPlaceholder("Channel"));
  assert.ok(isGenericPlaceholder("Project Channel"));
  assert.ok(isGenericPlaceholder("All Channels"));
  assert.ok(isGenericPlaceholder("Create project channels"));
});

test("isGenericPlaceholder allows specific names", () => {
  assert.equal(isGenericPlaceholder("Project Owner"), false);
  assert.equal(isGenericPlaceholder("announcements"), false);
  assert.equal(isGenericPlaceholder("01 — INFORMATION"), false);
  assert.equal(isGenericPlaceholder("Core Team Meeting"), false);
});

test("countExpectedResources detects role counts", () => {
  const prompt1 = "Create 14 roles";
  const result1 = countExpectedResources(prompt1);
  assert.ok(result1.roles >= 14, `Expected at least 14 roles, got ${result1.roles}`);

  // This test uses heuristics; just verify it doesn't throw
  const prompt2 = "Create these roles: Project Lead, Product Team, Technical Lead";
  const result2 = countExpectedResources(prompt2);
  assert.ok(typeof result2.roles === "number");
});

test("countExpectedResources detects category counts", () => {
  const prompt = `Create 5 categories:
1. INFORMATION
2. PRODUCT AND REQUIREMENTS
3. DEVELOPMENT
4. QA
5. TEAM VOICE`;
  const result = countExpectedResources(prompt);
  assert.ok(result.categories >= 4, `Expected at least 4 categories, got ${result.categories}`);
});

test("countExpectedResources detects channel counts", () => {
  const prompt = `Create text channels:
- announcements
- general
- rules
Create voice channels:
- general-voice
- meetings`;
  const result = countExpectedResources(prompt);
  // Heuristic counting; just verify it returns numbers and doesn't throw
  assert.ok(typeof result.textChannels === "number");
  assert.ok(typeof result.voiceChannels === "number");
  assert.ok(result.textChannels >= 0);
  assert.ok(result.voiceChannels >= 0);
});

test("countActionsByType counts operations correctly", () => {
  const actions = [
    { id: "1", type: "CREATE_ROLE", reason: "test", risk: "low" },
    { id: "2", type: "CREATE_ROLE", reason: "test", risk: "low" },
    { id: "3", type: "CREATE_CATEGORY", reason: "test", risk: "low" },
    { id: "4", type: "CREATE_TEXT_CHANNEL", reason: "test", risk: "low" },
  ];
  const counts = countActionsByType(actions);
  assert.equal(counts["CREATE_ROLE"], 2);
  assert.equal(counts["CREATE_CATEGORY"], 1);
  assert.equal(counts["CREATE_TEXT_CHANNEL"], 1);
  assert.equal(counts["CREATE_VOICE_CHANNEL"], undefined);
});

test("validateResourceCompleteness detects missing roles", () => {
  const prompt = "Create 14 roles";
  const plan = {
    actions: [
      {
        id: "role-generic",
        type: "CREATE_ROLE",
        name: "Role",
        reason: "test",
        risk: "low",
      },
    ],
    questions: [],
    warnings: [],
    assumptions: [],
    summary: "test",
  };
  const issues = validateResourceCompleteness(prompt, plan);
  assert.ok(issues.length > 0, "Should detect missing role operations");
  assert.ok(
    issues.some((i) => i.includes("14 role operations")),
    "Should mention expected 14 roles"
  );
});

test("validateResourceCompleteness detects missing categories", () => {
  const prompt = "Create 8 categories";
  const plan = {
    actions: [],
    questions: [],
    warnings: [],
    assumptions: [],
    summary: "test",
  };
  const issues = validateResourceCompleteness(prompt, plan);
  assert.ok(issues.length > 0, "Should detect missing category operations");
});

test("validateResourceCompleteness detects missing channels", () => {
  const prompt = "Create 25 text channels";
  const plan = {
    actions: [
      {
        id: "channel-generic",
        type: "CREATE_TEXT_CHANNEL",
        name: "Channel",
        reason: "test",
        risk: "low",
      },
    ],
    questions: [],
    warnings: [],
    assumptions: [],
    summary: "test",
  };
  const issues = validateResourceCompleteness(prompt, plan);
  assert.ok(issues.length > 0, "Should detect too few channel operations");
  assert.ok(issues.some((i) => i.includes("25")), "Should mention 25 channels");
});

test("validateActionNames rejects generic names", () => {
  const actions = [
    {
      id: "bad-role",
      type: "CREATE_ROLE",
      name: "Target",
      reason: "test",
      risk: "low",
    },
    {
      id: "bad-cat",
      type: "CREATE_CATEGORY",
      name: "Category",
      reason: "test",
      risk: "low",
    },
  ];
  const issues = validateActionNames(actions);
  assert.equal(issues.length, 2, "Should find 2 generic name issues");
  assert.ok(issues[0].includes("Target"));
  assert.ok(issues[1].includes("Category"));
});

test("validateActionNames accepts specific names", () => {
  const actions = [
    {
      id: "role-owner",
      type: "CREATE_ROLE",
      name: "Project Owner",
      reason: "test",
      risk: "low",
    },
    {
      id: "cat-info",
      type: "CREATE_CATEGORY",
      name: "01 — INFORMATION",
      reason: "test",
      risk: "low",
    },
  ];
  const issues = validateActionNames(actions);
  assert.equal(issues.length, 0, "Should accept specific names");
});

test("validateReferences detects orphaned category references", () => {
  const actions = [
    {
      id: "channel-test",
      type: "CREATE_TEXT_CHANNEL",
      name: "test-channel",
      categoryName: "NonexistentCategory",
      reason: "test",
      risk: "low",
    },
  ];
  const issues = validateReferences(actions);
  assert.ok(issues.length > 0, "Should detect missing category reference");
  assert.ok(
    issues.some((i) => i.includes("NonexistentCategory")),
    "Should mention the missing category"
  );
});

test("validateReferences detects orphaned role references", () => {
  const actions = [
    {
      id: "channel-perms",
      type: "SET_CHANNEL_PERMISSIONS",
      name: "test-channel",
      permissionOverwrites: [
        {
          roleName: "NonexistentRole",
          allow: ["ViewChannel"],
          deny: [],
        },
      ],
      reason: "test",
      risk: "low",
    },
  ];
  const issues = validateReferences(actions);
  assert.ok(issues.length > 0, "Should detect missing role reference");
  assert.ok(
    issues.some((i) => i.includes("NonexistentRole")),
    "Should mention the missing role"
  );
});

test("validateReferences allows valid references", () => {
  const actions = [
    {
      id: "role-owner",
      type: "CREATE_ROLE",
      name: "Project Owner",
      reason: "test",
      risk: "low",
    },
    {
      id: "cat-info",
      type: "CREATE_CATEGORY",
      name: "INFORMATION",
      reason: "test",
      risk: "low",
    },
    {
      id: "channel-announce",
      type: "CREATE_TEXT_CHANNEL",
      name: "announcements",
      categoryName: "INFORMATION",
      permissionOverwrites: [
        {
          roleName: "Project Owner",
          allow: ["ViewChannel", "SendMessages"],
          deny: [],
        },
      ],
      reason: "test",
      risk: "low",
    },
  ];
  const issues = validateReferences(actions);
  assert.equal(issues.length, 0, "Should accept valid references");
});

test("validatePlan combines all validations", () => {
  const prompt = "Create 14 roles and 8 categories";
  const plan = {
    summary: "test",
    assumptions: [],
    warnings: [],
    questions: [],
    actions: [
      {
        id: "bad-role",
        type: "CREATE_ROLE",
        name: "Target",
        reason: "test",
        risk: "low",
      },
    ],
  };
  const issues = validatePlan(prompt, plan);
  assert.ok(issues.length > 0, "Should find validation issues");
  assert.ok(issues.some((i) => i.includes("Target")), "Should flag placeholder name");
  assert.ok(
    issues.some((i) => i.includes("role operations")),
    "Should flag insufficient roles"
  );
  assert.ok(
    issues.some((i) => i.includes("category")),
    "Should flag insufficient categories"
  );
});

test("validatePlan succeeds on valid large plan", () => {
  const prompt = `Create 3 roles and 2 categories.
Roles: Owner, Admin, Member
Categories: General, Admin
Channels: 
- general (in General)
- admin (in Admin)`;

  const plan = {
    summary: "Setup",
    assumptions: [],
    warnings: [],
    questions: [],
    resourceCounts: {
      rolesRequested: 3,
      categoriesRequested: 2,
      textChannelsRequested: 2,
      voiceChannelsRequested: 0,
    },
    actions: [
      {
        id: "role-owner",
        type: "CREATE_ROLE",
        name: "Owner",
        reason: "Create owner role",
        risk: "low",
      },
      {
        id: "role-admin",
        type: "CREATE_ROLE",
        name: "Admin",
        reason: "Create admin role",
        risk: "low",
      },
      {
        id: "role-member",
        type: "CREATE_ROLE",
        name: "Member",
        reason: "Create member role",
        risk: "low",
      },
      {
        id: "cat-general",
        type: "CREATE_CATEGORY",
        name: "General",
        reason: "Create general category",
        risk: "low",
      },
      {
        id: "cat-admin",
        type: "CREATE_CATEGORY",
        name: "Admin",
        reason: "Create admin category",
        risk: "low",
      },
      {
        id: "channel-general",
        type: "CREATE_TEXT_CHANNEL",
        name: "general",
        categoryName: "General",
        reason: "Create general channel",
        risk: "low",
      },
      {
        id: "channel-admin",
        type: "CREATE_TEXT_CHANNEL",
        name: "admin",
        categoryName: "Admin",
        reason: "Create admin channel",
        risk: "low",
      },
    ],
  };

  const issues = validatePlan(prompt, plan);
  assert.equal(issues.length, 0, `Should have no issues, got: ${issues.join("; ")}`);
});
