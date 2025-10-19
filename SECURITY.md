# Security Guidelines

## 🔒 Environment Variables

This project uses environment variables to store sensitive information. **Never commit your `.env` file to Git!**

### Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the values in `.env`:**
   - Generate secure passwords (at least 32 characters)
   - Add your API keys for AI and OCR services
   - Keep these values secret!

3. **Generate secure secrets:**
   ```bash
   # Generate a secure MongoDB password
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   
   # Generate a secure JWT secret
   python3 -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

## 📋 What's Protected

- MongoDB credentials (username & password)
- JWT secret for authentication
- OpenAI API key
- DeepSeek API key
- Google Vision API key
- Baidu OCR credentials

## ⚠️ Important Notes

1. **`.env` is in `.gitignore`** - This prevents accidental commits
2. **`.env.example` is safe to commit** - It only contains placeholders
3. **Change default passwords** - Never use default passwords in production
4. **Rotate secrets regularly** - Update passwords and API keys periodically

## 🚨 If You Accidentally Commit Secrets

1. **Immediately rotate all exposed credentials**
2. **Remove the commit from Git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (only if the repository is private and you coordinate with team members)

## 🔐 Production Deployment

For production environments:

1. Use a secrets management system (AWS Secrets Manager, HashiCorp Vault, etc.)
2. Enable MongoDB authentication and use strong passwords
3. Use TLS/SSL for MongoDB connections
4. Restrict network access to MongoDB
5. Regularly audit and rotate credentials
6. Use environment-specific `.env` files (never copy production secrets to development)

## 📝 Checking for Exposed Secrets

Before committing, always check:

```bash
# Check what will be committed
git status

# Ensure .env is not listed
git diff --cached

# Verify .gitignore is working
git check-ignore .env
```

