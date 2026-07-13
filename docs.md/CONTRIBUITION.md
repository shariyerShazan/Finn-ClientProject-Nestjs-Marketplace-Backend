# Contributing Guide - Finn

Guidelines for contributing to the Finn marketplace platform.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

### Our Commitment

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Treat everyone with respect and kindness
- Welcome different perspectives and experiences
- Provide constructive feedback
- Focus on learning and improvement

### Unacceptable Behavior

The following behaviors are not tolerated:

- Harassment, discrimination, or intimidation
- Offensive language or personal attacks
- Publishing others' private information
- Any form of abuse or violence

Violations should be reported to the project maintainers. All complaints will be reviewed confidentially.

---

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v12+)
- Git
- Code editor (VSCode recommended)

### Setup Development Environment

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/finn.git
   cd finn
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

5. **Initialize database**
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Start development server**
   ```bash
   npm run start:dev
   ```

---

## Development Workflow

### Branch Naming Convention

Use descriptive branch names following this pattern:

```
feature/description       # New feature
fix/description          # Bug fix
refactor/description     # Code refactoring
docs/description         # Documentation
chore/description        # Maintenance tasks
```

**Examples**:
- `feature/add-seller-verification`
- `fix/payment-calculation-error`
- `refactor/auction-service`
- `docs/api-endpoints`

### Development Process

1. **Create and checkout feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes**
   - Write code following project standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Run tests and linting**
   ```bash
   npm run test
   npm run lint
   npm run format
   ```

4. **Commit changes**
   ```bash
   git commit -m "feat: add seller verification endpoint"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature
   ```

6. **Create Pull Request**
   - Go to repository on GitHub
   - Click "New Pull Request"
   - Select your branch and write a descriptive PR description

---

## Code Standards

### TypeScript/NestJS

- Use **TypeScript** for all code (no JavaScript)
- Enable strict type checking: `"strict": true`
- Use meaningful variable and function names
- Avoid `any` types - use proper typing

**Example**:
```typescript
// Good
export async function getUserById(userId: string): Promise<UserDto> {
  const user = await this.usersService.findById(userId);
  return this.mapToDto(user);
}

// Avoid
export async function getUser(id: any): Promise<any> {
  return this.service.get(id);
}
```

### NestJS Module Structure

```
src/
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   └── __tests__/
│       └── users.service.spec.ts
```

### Naming Conventions

- **Classes**: PascalCase (UserService, CreateUserDto)
- **Functions/Methods**: camelCase (getUserById, createUser)
- **Constants**: UPPER_SNAKE_CASE (DATABASE_URL, MAX_RETRIES)
- **Files**: kebab-case (user.controller.ts, create-user.dto.ts)
- **Interfaces**: Prefix with I (IUserRepository)

### Documentation

```typescript
/**
 * Creates a new user account
 * 
 * @param createUserDto - User creation data
 * @returns Promise<UserDto> - Created user
 * @throws ConflictException if email already exists
 * 
 * @example
 * await usersService.create({
 *   email: 'user@example.com',
 *   password: 'password'
 * })
 */
export async function create(createUserDto: CreateUserDto): Promise<UserDto> {
  // Implementation
}
```

### Error Handling

```typescript
// Good - Use NestJS HttpException
throw new ConflictException('User with this email already exists');
throw new NotFoundException(`User with ID ${id} not found`);
throw new BadRequestException('Invalid email format');

// Avoid
throw new Error('Something went wrong');
```

### Validation

Use NestJS validation with DTOs:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;
}
```

---

## Testing

### Test File Structure

```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    // Setup test module
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = 'test-id';
      const expectedUser = { id: userId, email: 'test@example.com' };

      // Act
      const result = await service.getUserById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';

      // Act & Assert
      await expect(service.getUserById(userId))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

### Test Coverage Goals

- **Minimum**: 80% overall coverage
- **Services**: 90% coverage (critical business logic)
- **Controllers**: 70% coverage (HTTP handling)
- **Utils**: 95% coverage (common utilities)

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, semicolons, etc)
- `refactor` - Code refactoring without feature change
- `perf` - Performance improvement
- `test` - Test additions/changes
- `chore` - Build/dependency changes

### Subject Line

- Use imperative mood ("add" not "added")
- Start with lowercase
- No period at the end
- Maximum 50 characters

### Body

- Explain WHAT and WHY, not HOW
- Wrap at 72 characters
- Separate from subject with blank line

### Examples

**Good Commits**:
```
feat(auth): add email verification endpoint

Implement OTP verification for user email confirmation
during signup process. Reduces spam and improves
account security.

Closes #123
```

```
fix(payments): correct fee calculation for decimal amounts

Round decimal amounts properly before calculating
platform fee. Prevents rounding errors that caused
incorrect seller payouts.

Fixes #456
```

**Avoid**:
```
fixed stuff
WIP
update
did some changes
```

---

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all checks locally**
   ```bash
   npm run lint
   npm run format
   npm run test
   npm run build
   ```

3. **Update documentation**
   - Update API.md if endpoints changed
   - Update README.md for new features
   - Add comments for complex logic

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
Describe how to test these changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log or debug code
- [ ] All tests pass locally
```

### PR Review Guidelines

- Provide constructive feedback
- Suggest improvements politely
- Ask questions if unclear
- Approve when satisfied
- Request changes if issues found

### After Approval

- Address any remaining comments
- Re-request review after updates
- Squash commits if requested
- Merge after final approval

---

## Reporting Issues

### Issue Template

```markdown
## Description
Clear description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. macOS 12.1]
- Node: [e.g. 16.13.0]
- Database: [e.g. PostgreSQL 13]

## Screenshots
If applicable, add screenshots

## Additional Context
Any other relevant information
```

### Issue Priority

- **Critical**: System down, data loss, security issue
- **High**: Major feature broken, significant impact
- **Medium**: Standard bug or feature request
- **Low**: Minor issue, nice to have

---

## Performance Guidelines

### Database Queries

```typescript
// Good - Use select to limit fields
const users = await prisma.auth.findMany({
  select: { id: true, email: true, firstName: true },
  where: { role: 'SELLER' }
});

// Avoid - SELECT *
const users = await prisma.auth.findMany({
  where: { role: 'SELLER' }
});
```

### Caching

- Cache frequently accessed data
- Invalidate cache on updates
- Use Redis for performance-critical data

### N+1 Query Prevention

```typescript
// Good - Use include
const ads = await prisma.ad.findMany({
  include: {
    seller: true,
    images: true
  }
});

// Avoid - Querying in loop
for (const ad of ads) {
  const seller = await prisma.auth.findUnique({
    where: { id: ad.sellerId }
  });
}
```

---

## Security Guidelines

### Input Validation

Always validate user input:

```typescript
// Use class-validator decorators
export class CreateAdDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @IsNumber()
  @Min(0)
  price: number;
}
```

### SQL Injection Prevention

- Use Prisma (protection built-in)
- Never concatenate queries
- Always use parameterized queries

### Authentication

- Always validate JWT tokens
- Use @UseGuards(AuthGuard) on protected endpoints
- Never store passwords in plain text

### Rate Limiting

- Implement rate limiting on public endpoints
- Use stricter limits for authentication endpoints

---

## Documentation

### README.md

Should include:
- Project description
- Tech stack
- Setup instructions
- Running tests
- Contributing guidelines

### API.md

Should document:
- All endpoints
- Request/response formats
- Error codes
- Authentication requirements
- Example usage

### Code Comments

```typescript
// Good - Explain complex logic
// Filter sellers with active listings and high ratings
// to ensure quality results for customers
const topSellers = sellers.filter(seller =>
  seller.activeListings > 0 && seller.rating >= 4.5
);

// Avoid - Obvious comments
// Loop through users
for (const user of users) {
```

---

## Getting Help

- **Questions**: Open a Discussion on GitHub
- **Bugs**: Open an Issue with details
- **Features**: Discuss in Issues before submitting PR
- **Documentation**: Check existing docs first

---

## License

By contributing, you agree that your contributions will be licensed under the project's license.

Thank you for contributing to Finn!
