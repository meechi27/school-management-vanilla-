---
name: guided-implementation
description: Implements the next unchecked task from an existing plan and task list, with a plan sanity-check, user-chosen learning mode, and approval before edits. Use when asked to continue a plan, implement the next task, or work through unchecked tasks one at a time.
---

# Guided Implementation

## Purpose

Help the user learn while turning an existing plan into working code. Work on
one task per invocation. The user chooses each time between guided AI
implementation and hands-on pairing.

Use this as the entry point when a plan and task list already exist.
`incremental-implementation` supplies the small-slice execution discipline;
`test-driven-development` applies when the task changes behavior.

## 1. Find and Check the Plan

1. Use paths the user gave you first.
2. Otherwise, check the repository's instructions for its plan and task-list
   source. Common defaults are `tasks/plan.md` and `tasks/todo.md`. If the
   project names an external tracker, use it instead of creating a duplicate.
3. Read the relevant plan section and task list. Check that the task list
   corresponds to the plan, dependencies are understood, and the next task has
   enough detail to act on.
4. Treat explicit task status as authoritative. In a Markdown checklist,
   `[x]` is complete and `[ ]` is unchecked. Do not infer completion from
   nearby notes or code alone.

If the plan or task list cannot be found, status is ambiguous, requirements
conflict, or the next task lacks essential acceptance details, stop and ask
one focused question. Do not invent a plan, rewrite tasks, or start coding.

If there are no unchecked tasks, say so and stop. Do not create additional work
or assume the user wants a review or a new plan.

## 2. Select One Task

Select the first unchecked task in the plan's stated order whose dependencies
are complete. Do not skip ahead to a later task just because it looks easier.
If an earlier task is blocked by an incomplete dependency or unclear status,
explain the blocker and ask what the user wants to do.

Before any edits, show a short task brief:

```text
NEXT TASK: [task id and title]
WHY THIS ONE: [position in the plan and dependency status]
DONE MEANS: [acceptance criteria in plain language]
APPROACH: [brief proposed implementation steps]
LIKELY FILES: [files found in the repository or task list]
VERIFY: [focused command or manual check, if known]
```

Keep the explanation concise and accessible. Explain unfamiliar terms briefly;
offer more detail instead of front-loading a lecture. If the task's acceptance
criteria or file scope needs changing, ask before changing the plan or task list.

## 3. Choose a Learning Mode

Ask the user on every task; do not assume a past choice still applies:

- **Guided AI:** Explain the approach, wait for approval, then implement the
  approved task. Briefly explain important decisions as you go.
- **Hands-on pairing:** Propose one small step for the user to try. Wait for
  their attempt, review it, and give a plain-language explanation plus a hint
  before providing a full correction. Do not take over the implementation
  unless the user asks.

Ask one question at a time. Do not edit files until the user has chosen a mode
and approved the specific approach for this task. After they choose a mode,
summarize the approach for that mode and ask for approval; wait for approval
before editing.

## 4. Implement Only the Approved Task

1. Read the relevant source, tests, and nearby examples before editing.
2. Restate the scope and respect the task's acceptance criteria. Do not add
   unrelated cleanup or continue into another task.
3. For behavior changes, follow the repository's test conventions and use the
   test-driven-development workflow where practical. Do not force tests for
   documentation-only or other non-behavioral changes.
4. Implement in small, understandable steps. Keep the code consistent with the
   project and explain non-obvious choices briefly.
5. If new information reveals a plan conflict, unsafe assumption, or necessary
   scope change, stop and ask before expanding the work.

Do not commit, push, create a branch, or install dependencies unless the user
asks or explicitly approves it.

## 5. Verify and Update Status

Run the smallest relevant verification available from the task or repository.
Report exactly what ran and whether it passed, failed, or could not be run.
Never describe a task as verified when checks were not run or failed.

The task checkbox tracks implementation, while verification results are
reported separately:

- Mark the task checked only when its implementation acceptance criteria are
  complete.
- If implementation is complete but a check fails for an unrelated or
  pre-existing reason, mark implementation complete and clearly report the
  failed verification.
- If a check shows the task's acceptance criteria are not met, leave it
  unchecked and explain what remains.
- Change only the status of the completed task. Ask before rewriting task text,
  acceptance criteria, dependencies, or the plan.

Finish with:

```text
IMPLEMENTED: [what changed]
TASK STATUS: [checked / left unchecked, with reason]
VERIFICATION: [command or manual check and outcome]
LEARNING NOTE: [brief explanation of one useful idea; omit if not useful]
NEXT: [name the next unchecked task, but do not start it]
```

Stop after one task. Continue only when the user asks.

## Red Flags

- Editing before the user chooses a mode and approves the approach
- Implementing more than one unchecked task in an invocation
- Guessing when plan, status, dependencies, or acceptance criteria conflict
- Marking verification as passed without running it
- Silently changing the plan or task text
- Committing or pushing without approval
- Replacing a hands-on attempt with the full solution before offering a hint
