---
name: git-conflict-resolver
description: Automated resolution of git merge conflicts, including identifying, parsing, and resolving conflict markers in files.
---

# Git Conflict Resolver

## Overview

Use this skill when facing git merge conflicts that require manual resolution.

## Workflow

1. **Analyze Conflicts**: Use `git status` to identify conflicted files.
2. **Examine**: Run `git diff <file>` to view conflict markers (<<<<<<<, =======, >>>>>>>).
3. **Resolve**: 
   - Choose the correct version (HEAD vs. remote branch).
   - Use `replace` or manual editing to remove conflict markers and keep the desired code.
   - For complex files (like HTML/JS), carefully maintain syntax and structure.
4. **Finalize**: Run `git add <file>` and `git commit` after all conflicts are resolved.

## Best Practices

- Always abort with `git merge --abort` if a resolution becomes too complex.
- Verify the file syntax after resolution.
- For large files, use `grep_search` to locate all conflict markers before starting.
- **Ensure no regressions**: Run related tests to confirm that the resolved code behaves correctly. A resolution is only complete when verified by tests.
