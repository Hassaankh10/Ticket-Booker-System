# ⚡ Quick EC2 Setup - Copy & Paste Commands

Run these commands in order on your EC2 instance:

---

## 1️⃣ Initial Setup (Run once)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git

# Install PM2 and Nginx
sudo npm install -g pm2
sudo apt install -y nginx

# Verify installations
node --version && npm --version && pm2 --version
```

---

## 2️⃣ Clone and Setup Project

```bash
# Clone repository
cd ~
git clone https://github.com/Hassaankh10/Ticket-Booker-System.git
cd Ticket-Booker-System

# Install dependencies
npm install

# Create environment file
cat > .env << 'EOF'
PORT=4000
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
NODE_ENV=production
DB_PATH=/home/ubuntu/Ticket-Booker-System/ticket_booking_system.db
EOF

# View your JWT_SECRET (save this!)
cat .env
```

---

## 3️⃣ Start Application

```bash
# Start with PM2
pm2 start server.js --name ticket-booker

# Save PM2 process list
pm2 save

# Setup auto-start on boot
pm2 startup
# Copy and run the command that PM2 outputs!

# Check status
pm2 status
```

---

## 4️⃣ Configure Nginx

```bash
# Create Nginx config
sudo tee /etc/nginx/sites-available/ticket-booker > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    
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
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/ticket-booker /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 5️⃣ Verify Deployment

```bash
# Check PM2
pm2 status

# Check Nginx
sudo systemctl status nginx

# Test locally
curl http://localhost:4000

# View logs
pm2 logs ticket-booker --lines 20
```

---

## 🎉 Done!

Your app is now live at: **http://YOUR_EC2_PUBLIC_IP**

**Admin Login:**
- Email: `admin@ticketbook.com`
- Password: `Admin@123`

---

## 🔄 Deploy Updates

```bash
cd ~/Ticket-Booker-System
git pull origin main
npm install
pm2 restart ticket-booker
```

---

## 🔒 Optional: Add SSL (with domain)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (replace YOUR_DOMAIN)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts and choose redirect option
```

---

## 📊 Useful Commands

```bash
# View logs
pm2 logs ticket-booker

# Restart app
pm2 restart ticket-booker

# Stop app
pm2 stop ticket-booker

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🚨 Troubleshooting

**App not starting?**
```bash
pm2 logs ticket-booker
pm2 restart ticket-booker
```

**Port already in use?**
```bash
sudo lsof -i :4000
sudo kill -9 <PID>
pm2 restart ticket-booker
```

**Nginx issues?**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

For detailed guide, see: **EC2-DEPLOYMENT-GUIDE.md**

