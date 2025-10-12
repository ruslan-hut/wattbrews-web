# Deployment Configuration

This document explains how to configure the GitHub Actions workflow for deploying the WattBrews web application to your production server.

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### 1. SSH_PRIVATE_KEY
- **Description**: Private SSH key for server authentication
- **How to generate**:
  ```bash
  # Generate a new SSH key pair (if you don't have one)
  ssh-keygen -t ed25519 -C "github-actions@wattbrews.me" -f ~/.ssh/github_actions_key
  
  # Copy the private key content
  cat ~/.ssh/github_actions_key
  ```
- **How to add**: Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret

### 2. SSH_USER
- **Description**: Username for SSH connection to your server
- **Example**: `deploy`, `ubuntu`, `root`, or your server username
- **How to add**: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

### 3. SSH_HOST
- **Description**: Server IP address or domain name
- **Example**: `123.456.789.0` or `server.wattbrews.me`
- **How to add**: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

## Required GitHub Variables

You need to add the following variables to your GitHub repository:

### 1. DEPLOY_PATH
- **Description**: Destination folder on the server
- **Value**: `/var/www/html/app.wattbrews.me`
- **How to add**: GitHub repo → Settings → Secrets and variables → Actions → Variables tab → New repository variable

## Server Setup

### 1. Add SSH Public Key to Server
Add the public key (corresponding to your private key) to your server:

```bash
# On your server, add the public key to authorized_keys
echo "your-public-key-content" >> ~/.ssh/authorized_keys

# Set proper permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 2. Create Destination Directory
```bash
# Create the deployment directory
sudo mkdir -p /var/www/html/app.wattbrews.me

# Set proper ownership (replace 'www-data' with your web server user)
sudo chown -R www-data:www-data /var/www/html/app.wattbrews.me

# Set proper permissions
sudo chmod -R 755 /var/www/html/app.wattbrews.me
```

### 3. Web Server Configuration
Make sure your web server (Nginx/Apache) is configured to serve files from `/var/www/html/app.wattbrews.me`.

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name app.wattbrews.me;
    root /var/www/html/app.wattbrews.me;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Handle Angular routing
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Workflow Triggers

The deployment workflow will run:
- **Automatically**: When code is pushed to the `main` branch
- **Manually**: Via GitHub Actions tab → "Deploy to Production Server" → "Run workflow"

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify SSH_PRIVATE_KEY is correctly added
   - Check SSH_USER and SSH_HOST values
   - Ensure the public key is added to server's authorized_keys

2. **Permission Denied**
   - Check if the SSH user has write access to DEPLOY_PATH
   - Verify directory permissions on the server

3. **Build Failed**
   - Check if all dependencies are properly installed
   - Verify Node.js version compatibility

4. **Files Not Deployed**
   - Check if rsync is installed on the server
   - Verify the DEPLOY_PATH variable is correct

### Debugging

To debug deployment issues:
1. Check the GitHub Actions logs in your repository
2. Test SSH connection manually: `ssh -i your-private-key user@host`
3. Verify server directory permissions: `ls -la /var/www/html/app.wattbrews.me`

## Security Notes

- Never commit private keys to your repository
- Use repository secrets for sensitive information
- Regularly rotate SSH keys
- Consider using deploy keys for better security isolation

---

**Version**: 1.0  
**Last Updated**: October 2025
