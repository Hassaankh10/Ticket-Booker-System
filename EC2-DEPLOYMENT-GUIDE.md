# 🚀 EC2 Deployment Guide - Ticket Booker System

Complete guide to deploy your Ticket Booking System on AWS EC2.

---

## 📋 Prerequisites

- AWS Account
- EC2 instance (Ubuntu 20.04 or 22.04 recommended)
- SSH access to your EC2 instance
- Domain name (optional, but recommended)

---

## 🖥️ Step 1: Launch EC2 Instance

### Instance Configuration:
- **AMI**: Ubuntu Server 22.04 LTS
- **Instance Type**: t2.micro (Free tier) or t2.small
- **Storage**: 8GB minimum (20GB recommended)
- **Security Group**: Configure ports (see below)

### Security Group Rules:
| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | Your IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |
| Custom | TCP | 4000 | 0.0.0.0/0 | Node.js app (temporary) |

---

## 🔐 Step 2: Connect to Your EC2 Instance

```bash
# Download your .pem key file and set permissions
chmod 400 your-key.pem

# Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

---

## 📦 Step 3: Install Required Software

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18.x LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x

# Install Git
sudo apt install -y git

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Web Server)
sudo apt install -y nginx
```

---

## 📥 Step 4: Clone Your Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/Hassaankh10/Ticket-Booker-System.git

# Navigate to project
cd Ticket-Booker-System

# Install dependencies
npm install
```

---

## 🔧 Step 5: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following content:

```env
PORT=4000
JWT_SECRET=your-super-secure-secret-key-change-this-to-random-string
NODE_ENV=production
DB_PATH=/home/ubuntu/Ticket-Booker-System/ticket_booking_system.db
```

**Generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Save and exit (Ctrl+X, then Y, then Enter)

---

## 🚀 Step 6: Start Application with PM2

```bash
# Start the application
pm2 start server.js --name ticket-booker

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Copy and run the command that PM2 outputs
# It will look something like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### PM2 Useful Commands:
```bash
pm2 status              # Check app status
pm2 logs ticket-booker  # View logs
pm2 restart ticket-booker  # Restart app
pm2 stop ticket-booker  # Stop app
pm2 delete ticket-booker  # Remove from PM2
```

---

## 🌐 Step 7: Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/ticket-booker
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain or EC2 IP

    # Increase client body size for file uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable the site:**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ticket-booker /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

---

## 🔒 Step 8: Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 🔄 Step 9: Setup Auto-Deployment (Optional)

Create a deployment script:

```bash
# Create deploy script
nano ~/deploy.sh
```

Add this content:

```bash
#!/bin/bash

# Navigate to project directory
cd /home/ubuntu/Ticket-Booker-System

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Restart the application
pm2 restart ticket-booker

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x ~/deploy.sh
```

**To deploy updates:**
```bash
~/deploy.sh
```

---

## 🔍 Step 10: Verify Deployment

### Check Application Status:
```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs ticket-booker --lines 50

# Check Nginx status
sudo systemctl status nginx
```

### Test Your Application:
```bash
# Test locally
curl http://localhost:4000

# Test via Nginx
curl http://your-ec2-public-ip
```

### Access Your Site:
- **HTTP**: http://your-ec2-public-ip
- **With Domain**: http://your-domain.com
- **With SSL**: https://your-domain.com

---

## 📊 Monitoring & Maintenance

### View Logs:
```bash
# Application logs
pm2 logs ticket-booker

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### Database Backup:
```bash
# Create backup script
nano ~/backup-db.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DB_PATH="/home/ubuntu/Ticket-Booker-System/ticket_booking_system.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/ticket_booking_system_$DATE.db

# Keep only last 7 days of backups
find $BACKUP_DIR -name "ticket_booking_system_*.db" -mtime +7 -delete

echo "Backup completed: ticket_booking_system_$DATE.db"
```

Make executable and add to crontab:
```bash
chmod +x ~/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /home/ubuntu/backup-db.sh
```

---

## 🔧 Troubleshooting

### Application Not Starting:
```bash
# Check logs
pm2 logs ticket-booker

# Check if port 4000 is in use
sudo lsof -i :4000

# Restart application
pm2 restart ticket-booker
```

### Nginx Issues:
```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

### Database Issues:
```bash
# Check database file permissions
ls -la ~/Ticket-Booker-System/ticket_booking_system.db

# Fix permissions if needed
chmod 644 ~/Ticket-Booker-System/ticket_booking_system.db
```

### Port Already in Use:
```bash
# Find process using port 4000
sudo lsof -i :4000

# Kill the process (replace PID)
sudo kill -9 PID
```

---

## 🚀 Quick Deployment Checklist

- [ ] EC2 instance launched with proper security groups
- [ ] Connected via SSH
- [ ] Node.js, Git, PM2, Nginx installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with secure JWT_SECRET
- [ ] Application started with PM2
- [ ] PM2 configured to start on boot
- [ ] Nginx configured as reverse proxy
- [ ] Nginx enabled and restarted
- [ ] SSL certificate installed (optional)
- [ ] Application accessible via browser
- [ ] Database working and persisting data

---

## 🎯 Performance Optimization

### Enable Gzip Compression:
```bash
sudo nano /etc/nginx/nginx.conf
```

Add in `http` block:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### Add Caching Headers:
Add to your Nginx server block:
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 📱 Access Your Application

After deployment, your application will be accessible at:

- **Public IP**: http://your-ec2-public-ip
- **Domain**: http://your-domain.com (if configured)
- **Secure**: https://your-domain.com (if SSL configured)

**Default Admin Credentials:**
- Email: `admin@ticketbook.com`
- Password: `Admin@123`

**⚠️ Change these credentials immediately after first login!**

---

## 🎉 Congratulations!

Your Ticket Booker System is now live on EC2 with:
- ✅ Persistent SQLite database
- ✅ Process management with PM2
- ✅ Nginx reverse proxy
- ✅ Auto-restart on server reboot
- ✅ Production-ready configuration

---

## 📞 Need Help?

Common issues and solutions are in the Troubleshooting section above.

For updates, simply run:
```bash
~/deploy.sh
```

Happy deploying! 🚀

