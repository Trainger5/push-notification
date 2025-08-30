#!/bin/bash

# NotifyPro Health Check Script
# Run this to verify your production deployment

echo "🏥 NotifyPro Health Check Starting..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0

# Function to run health checks
check_service() {
    local service_name="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "Checking $service_name... "
    
    if eval "$command" &>/dev/null; then
        if [ -n "$expected" ]; then
            result=$(eval "$command" 2>/dev/null)
            if [[ "$result" == *"$expected"* ]]; then
                echo -e "${GREEN}✅ PASS${NC}"
                ((PASSED++))
            else
                echo -e "${RED}❌ FAIL${NC} (unexpected response)"
                ((FAILED++))
            fi
        else
            echo -e "${GREEN}✅ PASS${NC}"
            ((PASSED++))
        fi
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
    fi
}

echo ""
echo "🔍 System Health Checks:"
echo "========================"

# Check if PM2 is running
check_service "PM2 Process Manager" "pm2 status | grep -q 'online'"

# Check if Node.js processes are running
check_service "NotifyPro API Process" "pm2 status | grep -q 'notifypro-api.*online'"

# Check backend API health
check_service "Backend API Health" "curl -s -f http://localhost:4000/health" "ok"

# Check if port 4000 is listening
check_service "Port 4000 Listening" "netstat -tlnp | grep -q ':4000'"

# Check database file exists
check_service "Database File" "test -f /var/www/html/push-notification/backend/data/users.db"

# Check frontend build exists
check_service "Frontend Build" "test -f /var/www/html/push-notification/frontend/dist/index.html"

# Check nginx status (if installed)
if command -v nginx &> /dev/null; then
    check_service "Nginx Service" "systemctl is-active nginx | grep -q 'active'"
    check_service "Nginx Config Valid" "nginx -t"
fi

# Check SSL certificate (if configured)
if [ -f "/etc/letsencrypt/live/yourdomain.com/fullchain.pem" ]; then
    check_service "SSL Certificate" "openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -noout -dates"
fi

# Check disk space
check_service "Disk Space (>10% free)" "[ $(df / | tail -1 | awk '{print $5}' | sed 's/%//') -lt 90 ]"

# Check memory usage
check_service "Memory Usage (<80%)" "[ $(free | grep Mem | awk '{printf \"%.0f\", $3/$2 * 100.0}') -lt 80 ]"

echo ""
echo "📊 API Endpoint Tests:"
echo "======================"

# Test public endpoints
check_service "GET /health" "curl -s -f http://localhost:4000/health | grep -q 'ok'"
check_service "GET /sdk.js" "curl -s -f http://localhost:4000/sdk.js | grep -q 'NotifyPro'"

# Test with authentication (if you have a test token)
if [ -n "$TEST_TOKEN" ]; then
    check_service "GET /api/profile (auth)" "curl -s -f -H 'Authorization: Bearer $TEST_TOKEN' http://localhost:4000/api/profile"
fi

echo ""
echo "🔧 PM2 Process Status:"
echo "======================"
pm2 status

echo ""
echo "📈 System Resources:"
echo "==================="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "Used: " 100 - $1 "%"}'

echo "Memory Usage:"
free -h | awk '/^Mem:/ {printf "Used: %s / %s (%.1f%%)\n", $3, $2, ($3/$2)*100}'

echo "Disk Usage:"
df -h / | awk 'NR==2{printf "Used: %s / %s (%s)\n", $3, $2, $5}'

echo ""
echo "📝 Recent Logs (last 10 lines):"
echo "================================"
pm2 logs --lines 10 --raw

echo ""
echo "🎯 Health Check Summary:"
echo "========================"
echo -e "✅ Passed: ${GREEN}$PASSED${NC}"
echo -e "❌ Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All health checks passed! Your NotifyPro system is running perfectly.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some health checks failed. Please investigate the issues above.${NC}"
    exit 1
fi