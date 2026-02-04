# 🚀 Deployment Guide for STA Backend

This guide will help you deploy the STA Backend to various hosting platforms.

---

## ✅ Pre-Deployment Checklist

### 1. Security ✓
- [x] Removed hardcoded credentials from code
- [x] Environment variables properly configured
- [x] JWT secret is strong (min 64 characters)
- [x] CORS configured for specific origins
- [x] Rate limiting enabled
- [x] Helmet.js security headers enabled
- [x] MongoDB sanitization enabled

### 2. Configuration ✓
- [x] `.env.example` created
- [x] `.gitignore` includes `.env`
- [x] Config validates required environment variables
- [x] Port configurable via environment

### 3. Dependencies ✓
- [x] All dependencies in `package.json`
- [x] Production-ready packages used
- [x] No dev dependencies in production

### 4. Database ✓
- [x] MongoDB Atlas (cloud) configured
- [x] Connection string uses environment variable
- [x] Proper error handling for DB connection

### 5. Scripts ✓
- [x] `npm start` for production
- [x] `npm run dev` for development
- [x] Seed scripts available

---

## 🌐 Hosting Options

### **Option 1: Railway (Recommended - Free Tier Available)**

Railway provides easy deployment with automatic HTTPS and environment variables.

#### Steps:
1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add Environment Variables**
   In Railway dashboard, add these variables:
   ```
   NODE_ENV=production
   PORT=3000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   JWT_SECRET=your-64-character-secret-key-here
   JWT_EXPIRES_IN=8h
   CORS_ORIGINS=https://your-frontend-domain.com
   RATE_WINDOW_MS=900000
   RATE_MAX=100
   ```

4. **Deploy**
   - Railway will auto-deploy on every push to main branch
   - Get your public URL: `https://your-app.railway.app`

5. **Run Seed**
   - In Railway dashboard, go to "Settings" → "Deploy"
   - Run: `node src/seeds/seed-test-users.js`

---

### **Option 2: Render (Free Tier Available)**

#### Steps:
1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: Komunitas-Belajar-Berdampak-backend
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

3. **Add Environment Variables**
   Same as Railway (see above)

4. **Deploy**
   - Click "Create Web Service"
   - Get your URL: `https://sta-backend.onrender.com`

---

### **Option 3: Heroku**

#### Steps:
1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   heroku create sta-backend
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGO_URI="mongodb+srv://..."
   heroku config:set JWT_SECRET="your-secret-key"
   heroku config:set CORS_ORIGINS="https://your-frontend.com"
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Run Seed**
   ```bash
   heroku run node src/seeds/seed-test-users.js
   ```

---

### **Option 4: Vercel (Serverless)**

⚠️ **Note**: Vercel is better for frontend. For backend with persistent connections (MongoDB), use Railway/Render.

#### Steps:
1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Create `vercel.json`**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/server.js"
       }
     ]
   }
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   - Go to Vercel dashboard
   - Settings → Environment Variables
   - Add all required variables

---

### **Option 5: DigitalOcean App Platform**

#### Steps:
1. **Create DigitalOcean Account**
   - Go to [digitalocean.com](https://digitalocean.com)

2. **Create App**
   - Apps → Create App
   - Connect GitHub repository
   - Select Node.js

3. **Configure**
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
   - **HTTP Port**: 3000

4. **Add Environment Variables**
   Same as above

---

### **Option 6: AWS Elastic Beanstalk**

For enterprise-level deployment with full control.

#### Steps:
1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize**
   ```bash
   eb init -p node.js sta-backend
   ```

3. **Create Environment**
   ```bash
   eb create production
   ```

4. **Set Environment Variables**
   ```bash
   eb setenv NODE_ENV=production MONGO_URI="..." JWT_SECRET="..."
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

---

## 🔒 Production Environment Variables

**Required:**
```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=min-64-characters-long-secret-key
```

**Optional:**
```bash
PORT=3000
JWT_EXPIRES_IN=8h
CORS_ORIGINS=https://frontend.com,https://www.frontend.com
RATE_WINDOW_MS=900000
RATE_MAX=100
```

---

## 🧪 Testing Your Deployment

After deployment, test these endpoints:

1. **Health Check**
   ```bash
   curl https://your-app.com/health
   ```

2. **Login**
   ```bash
   curl -X POST https://your-app.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"nrp":"Admin","password":"password123"}'
   ```

3. **Swagger Docs**
   ```
   https://your-app.com/docs
   ```

---

## 📊 Monitoring

### Logs
- **Railway**: Dashboard → Deployments → View logs
- **Render**: Dashboard → Logs
- **Heroku**: `heroku logs --tail`

### Health Monitoring
Set up monitoring for `/health` endpoint using:
- [UptimeRobot](https://uptimerobot.com) (Free)
- [Pingdom](https://www.pingdom.com)
- [Better Uptime](https://betteruptime.com)

---

## 🔐 Security Best Practices

1. **JWT Secret**
   - Generate strong secret: `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"`
   - Never commit to git
   - Rotate periodically

2. **MongoDB**
   - Use MongoDB Atlas with IP whitelist
   - Create separate user for production
   - Enable MongoDB authentication

3. **CORS**
   - Set specific origins in production
   - Never use `*` in production

4. **Rate Limiting**
   - Adjust based on expected traffic
   - Monitor for abuse

5. **HTTPS**
   - All platforms provide free HTTPS
   - Enforce HTTPS only in production

---

## 🚨 Common Issues

### Issue: "Cannot connect to MongoDB"
**Solution**:
- Check MONGO_URI is correct
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0` for cloud hosting
- Check MongoDB Atlas username/password

### Issue: "Token tidak ditemukan"
**Solution**:
- Ensure JWT_SECRET is set
- Check Authorization header format: `Bearer <token>`

### Issue: "CORS error"
**Solution**:
- Add frontend URL to CORS_ORIGINS
- Format: `https://frontend.com` (no trailing slash)

---

## 📝 Post-Deployment

1. **Run Seeds**
   ```bash
   # Railway/Render: Use dashboard shell
   node src/seeds/seed-test-users.js
   ```

2. **Test All Endpoints**
   - Import Postman collection
   - Update base_url to production URL
   - Test all endpoints

3. **Update Frontend**
   - Change API base URL to production
   - Update CORS_ORIGINS to include frontend URL

4. **Monitor**
   - Set up uptime monitoring
   - Check logs regularly
   - Monitor MongoDB usage

---

## ✅ Deployment Status

Current Status: **READY FOR DEPLOYMENT** ✓

- ✅ Security issues fixed
- ✅ Environment variables configured
- ✅ Config validates required vars
- ✅ Database ready (MongoDB Atlas)
- ✅ All dependencies production-ready
- ✅ Deployment guide created

**Recommended Platform**: Railway or Render (Free tier available)

---

## 📞 Support

If you encounter issues:
1. Check logs in hosting platform dashboard
2. Verify all environment variables are set
3. Test `/health` endpoint
4. Check MongoDB Atlas connection

---

**Your backend is now ready to deploy! Choose a platform and follow the steps above.** 🚀
