# AI Agents Workflow

This document describes the AI-assisted development workflow used for the AirbusDriver project.

## Overview

We use a multi-agent approach to development, leveraging different AI tools for specific tasks:

- **Claude Code** - Primary development agent for implementation, refactoring, and debugging
- **ChatGPT** - Code review and PR feedback
- **Google Antigravity** - AI-assisted development work

## Agent Roles & Responsibilities

### Claude Code

**Primary Use Cases:**
- Feature implementation
- Bug fixes and debugging
- Code refactoring
- Documentation updates
- Architecture decisions
- Performance optimization

**Workflow:**
1. Start Claude Code in the project directory
2. Provide context about the task (reference issues, PRs, or documentation)
3. Let Claude explore the codebase to understand current implementation
4. Review and iterate on Claude's proposed changes
5. Commit changes with descriptive messages

**Best Practices:**
- Let Claude read existing code before making changes
- Reference specific files and line numbers for precise context
- Use Claude for complex refactoring that spans multiple files
- Leverage Claude's ability to understand the full codebase context

**Example Commands:**
```bash
# Start Claude Code
claude

# Common prompts
"Add a new filter option for viewing entries from the last 7 days"
"Optimize the search highlighting function for better performance"
"Fix the bug where cache doesn't invalidate after double refresh"
"Update README.md with the new deployment process"
```

### ChatGPT - Code Review

**Primary Use Cases:**
- PR code reviews
- Identifying potential bugs or edge cases
- Suggesting alternative implementations
- Security vulnerability checks
- Code quality feedback

**Workflow:**
1. Create a PR with your changes
2. Copy the diff or share the PR link with ChatGPT
3. Ask for specific review focus areas (e.g., "Review for security issues")
4. Address feedback in follow-up commits
5. Document significant review findings

**Review Checklist:**
- [ ] Security vulnerabilities (XSS, injection attacks)
- [ ] Performance implications
- [ ] Browser compatibility issues
- [ ] Edge cases and error handling
- [ ] Code maintainability and readability
- [ ] Consistent with project patterns

**Example Prompts:**
```
"Review this PR for potential security issues: [PR link or diff]"
"Check this caching implementation for race conditions"
"Suggest improvements for this search algorithm"
```

### Google Antigravity

**Primary Use Cases:**
- AI-assisted development
- Rapid prototyping
- Exploratory coding
- Alternative solution generation

**Workflow:**
1. Use for experimental features or proof-of-concepts
2. Test generated code thoroughly before integration
3. Refactor AI-generated code to match project style
4. Document any AI-assisted sections for future reference

## Project-Specific Workflows

### Adding a New Feature

1. **Planning** (Claude Code)
   - Discuss feature requirements
   - Review existing architecture
   - Plan implementation approach

2. **Implementation** (Claude Code)
   - Write feature code
   - Add tests if applicable
   - Update documentation

3. **Review** (ChatGPT)
   - Create PR
   - Get AI code review
   - Address feedback

4. **Refinement** (Claude Code)
   - Implement review feedback
   - Final polish and optimization

### Bug Fixes

1. **Diagnosis** (Claude Code)
   - Describe the bug behavior
   - Let Claude analyze relevant code
   - Identify root cause

2. **Fix Implementation** (Claude Code)
   - Apply fix
   - Test edge cases
   - Update tests if needed

3. **Verification** (ChatGPT)
   - Review fix for unintended side effects
   - Check for similar bugs elsewhere

### Performance Optimization

1. **Analysis** (Claude Code)
   - Identify bottlenecks
   - Review performance metrics
   - Propose optimization strategies

2. **Implementation** (Claude Code)
   - Apply optimizations (e.g., regex memoization, caching)
   - Measure improvements
   - Document performance gains

3. **Review** (ChatGPT)
   - Verify optimization correctness
   - Check for edge cases
   - Ensure no functionality regression

## Technology-Specific Guidelines

### Frontend (HTML/CSS/JS)

**Claude Code:**
- Maintain vanilla JS approach (no framework dependencies)
- Preserve existing coding style and patterns
- Keep accessibility in mind
- Ensure mobile responsiveness

**ChatGPT Review Focus:**
- Cross-browser compatibility
- Performance (DOM operations, reflows)
- Memory leaks
- Accessibility (ARIA, semantic HTML)

### Cloudflare Workers

**Claude Code:**
- Follow Workers runtime limitations
- Optimize for edge performance
- Handle errors gracefully
- Maintain cache strategy

**ChatGPT Review Focus:**
- Cold start optimization
- Security headers
- CORS handling
- Error responses

### Caching Strategy

**Claude Code:**
- Understand two-tier cache (localStorage + Cloudflare)
- Preserve 24-hour cache duration
- Maintain cache invalidation logic (double-refresh)
- Consider cache hit/miss patterns

**ChatGPT Review Focus:**
- Cache key collisions
- Stale data scenarios
- Cache invalidation edge cases
- Performance trade-offs

## Best Practices

### General Guidelines

1. **Context is Key**: Always provide relevant context (issue numbers, related files, error messages)
2. **Iterative Development**: Make incremental changes rather than large rewrites
3. **Test Thoroughly**: AI-generated code should be tested like any other code
4. **Maintain Style**: Ensure AI suggestions match project coding standards
5. **Document Decisions**: Record why certain AI suggestions were accepted or rejected

### Security Considerations

- Never commit API keys or secrets suggested by AI
- Review AI-generated security-related code carefully
- Validate all user inputs, even in AI-suggested code
- Check CORS and CSP configurations

### Performance

- Benchmark AI-suggested optimizations
- Don't over-optimize based on AI suggestions
- Consider real-world usage patterns
- Monitor Web Vitals after changes

## Integration with Git Workflow

### Branch Naming
```bash
# For Claude Code automated branches
claude/feature-description-SessionId

# For manual branches
feature/feature-name
fix/bug-description
perf/optimization-description
docs/documentation-update
```

### Commit Messages

Claude Code typically generates descriptive commit messages. Follow this format:

```
<type>: <brief description>

<detailed explanation if needed>

- Bullet points for multiple changes
- Related issue: #123
```

Types: `feat`, `fix`, `perf`, `docs`, `refactor`, `style`, `test`, `chore`

### Pull Request Process

1. **Create PR** with descriptive title and summary
2. **AI Review** (ChatGPT) - paste diff or share link
3. **Address Feedback** with Claude Code
4. **Final Review** - Human review before merge
5. **Merge** and deploy via GitHub Actions

## Troubleshooting AI Interactions

### Claude Code

**Issue:** Claude makes changes without reading the file first
**Solution:** Explicitly ask "First read the current implementation"

**Issue:** Claude suggests over-engineered solutions
**Solution:** Specify "Keep it simple" or "Minimal changes only"

**Issue:** Claude doesn't understand project context
**Solution:** Reference existing documentation (README.md, cachingplan.md)

### ChatGPT Reviews

**Issue:** Reviews are too generic
**Solution:** Provide specific focus areas or ask targeted questions

**Issue:** Suggestions conflict with project architecture
**Solution:** Provide context about design decisions and constraints

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Project README](README.md) - Architecture overview
- [Deployment Guide](DEPLOYMENT.md) - Setup and deployment
- [Caching Plan](cachingplan.md) - Caching strategy details

## Contributing

When using AI agents for this project:

1. Review all AI-generated code before committing
2. Test changes locally and verify functionality
3. Update this document if you discover new effective workflows
4. Share learnings with the team

## Changelog

- 2026-01-11: Initial agents.md documentation created
