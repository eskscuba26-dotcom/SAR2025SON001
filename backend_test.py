#!/usr/bin/env python3
"""
SAR Ambalaj Production Management System - Backend API Tests
Tests all major API endpoints for functionality and response validation
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend environment
BACKEND_URL = "https://github-file-opener.preview.emergentagent.com/api"

# Default admin credentials
ADMIN_CREDENTIALS = {
    "username": "admin",
    "password": "SAR2025!"
}

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, endpoint, method, status, message, response_data=None):
        """Log test results"""
        result = {
            "endpoint": endpoint,
            "method": method,
            "status": "PASS" if status else "FAIL",
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_sample"] = response_data
        self.test_results.append(result)
        
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {method} {endpoint}: {message}")
        
    def test_authentication(self):
        """Test authentication endpoint"""
        print("\n🔐 Testing Authentication...")
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json=ADMIN_CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "username" in data and "role" in data:
                    self.log_test("/auth/login", "POST", True, 
                                f"Authentication successful - User: {data['username']}, Role: {data['role']}")
                    return True
                else:
                    self.log_test("/auth/login", "POST", False, 
                                "Authentication response missing required fields")
                    return False
            else:
                self.log_test("/auth/login", "POST", False, 
                            f"Authentication failed - Status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("/auth/login", "POST", False, f"Request failed: {str(e)}")
            return False
    
    def test_stock_stats(self):
        """Test stock statistics endpoint"""
        print("\n📊 Testing Stock Statistics...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/stock/stats", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["totalStock", "cutProducts", "productions", "materials"]
                
                if all(field in data for field in required_fields):
                    materials = data.get("materials", {})
                    expected_materials = ["gaz", "petkim", "estol", "talk", "masura100", "masura120", "masura150", "masura200", "sari"]
                    
                    if all(mat in materials for mat in expected_materials):
                        self.log_test("/stock/stats", "GET", True, 
                                    f"Stock stats retrieved - Total Stock: {data['totalStock']}, Productions: {data['productions']}")
                        return True
                    else:
                        self.log_test("/stock/stats", "GET", False, 
                                    "Stock stats missing required material fields")
                        return False
                else:
                    self.log_test("/stock/stats", "GET", False, 
                                "Stock stats missing required fields")
                    return False
            else:
                self.log_test("/stock/stats", "GET", False, 
                            f"Stock stats failed - Status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("/stock/stats", "GET", False, f"Request failed: {str(e)}")
            return False
    
    def test_productions(self):
        """Test productions endpoint"""
        print("\n🏭 Testing Productions...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/production", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("/production", "GET", True, 
                                f"Productions retrieved - Count: {len(data)}")
                    return True
                else:
                    self.log_test("/production", "GET", False, 
                                "Productions response is not a list")
                    return False
            else:
                self.log_test("/production", "GET", False, 
                            f"Productions failed - Status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("/production", "GET", False, f"Request failed: {str(e)}")
            return False
    
    def test_materials(self):
        """Test materials endpoint"""
        print("\n🧱 Testing Materials...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/materials", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("/materials", "GET", True, 
                                f"Materials retrieved - Count: {len(data)}")
                    return True
                else:
                    self.log_test("/materials", "GET", False, 
                                "Materials response is not a list")
                    return False
            else:
                self.log_test("/materials", "GET", False, 
                            f"Materials failed - Status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("/materials", "GET", False, f"Request failed: {str(e)}")
            return False
    
    def test_daily_consumption(self):
        """Test daily consumption endpoint"""
        print("\n📈 Testing Daily Consumption...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/daily-consumption", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("/daily-consumption", "GET", True, 
                                f"Daily consumption retrieved - Count: {len(data)}")
                    return True
                else:
                    self.log_test("/daily-consumption", "GET", False, 
                                "Daily consumption response is not a list")
                    return False
            else:
                self.log_test("/daily-consumption", "GET", False, 
                            f"Daily consumption failed - Status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("/daily-consumption", "GET", False, f"Request failed: {str(e)}")
            return False
    
    def test_cost_analysis(self):
        """Test cost analysis endpoint"""
        print("\n💰 Testing Cost Analysis...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/cost-analysis", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("/cost-analysis", "GET", True, 
                                f"Cost analysis retrieved - Count: {len(data)}")
                    return True
                else:
                    self.log_test("/cost-analysis", "GET", False, 
                                "Cost analysis response is not a list")
                    return False
            else:
                self.log_test("/cost-analysis", "GET", False, 
                            f"Cost analysis failed - Status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("/cost-analysis", "GET", False, f"Request failed: {str(e)}")
            return False
    
    def test_shipments(self):
        """Test shipments endpoint"""
        print("\n🚚 Testing Shipments...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/shipments", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("/shipments", "GET", True, 
                                f"Shipments retrieved - Count: {len(data)}")
                    return True
                else:
                    self.log_test("/shipments", "GET", False, 
                                "Shipments response is not a list")
                    return False
            else:
                self.log_test("/shipments", "GET", False, 
                            f"Shipments failed - Status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("/shipments", "GET", False, f"Request failed: {str(e)}")
            return False
    
    def test_cut_products(self):
        """Test cut products endpoint"""
        print("\n✂️ Testing Cut Products...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/cut-products", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("/cut-products", "GET", True, 
                                f"Cut products retrieved - Count: {len(data)}")
                    return True
                else:
                    self.log_test("/cut-products", "GET", False, 
                                "Cut products response is not a list")
                    return False
            else:
                self.log_test("/cut-products", "GET", False, 
                            f"Cut products failed - Status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("/cut-products", "GET", False, f"Request failed: {str(e)}")
            return False
    
    def test_exchange_rates(self):
        """Test exchange rates endpoint"""
        print("\n💱 Testing Exchange Rates...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/exchange-rates", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["usd", "eur"]
                
                if all(field in data for field in required_fields):
                    self.log_test("/exchange-rates", "GET", True, 
                                f"Exchange rates retrieved - USD: {data['usd']}, EUR: {data['eur']}")
                    return True
                else:
                    self.log_test("/exchange-rates", "GET", False, 
                                "Exchange rates missing required fields")
                    return False
            else:
                self.log_test("/exchange-rates", "GET", False, 
                            f"Exchange rates failed - Status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("/exchange-rates", "GET", False, f"Request failed: {str(e)}")
            return False
    
    def test_cors(self):
        """Test CORS configuration"""
        print("\n🌐 Testing CORS Configuration...")
        
        try:
            # Test preflight request
            response = self.session.options(
                f"{BACKEND_URL}/auth/login",
                headers={
                    'Origin': 'https://github-file-opener.preview.emergentagent.com',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type'
                },
                timeout=10
            )
            
            if response.status_code in [200, 204]:
                cors_headers = response.headers
                if 'Access-Control-Allow-Origin' in cors_headers:
                    self.log_test("CORS", "OPTIONS", True, 
                                "CORS properly configured")
                    return True
                else:
                    self.log_test("CORS", "OPTIONS", False, 
                                "CORS headers missing")
                    return False
            else:
                self.log_test("CORS", "OPTIONS", False, 
                            f"CORS preflight failed - Status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("CORS", "OPTIONS", False, f"CORS test failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting SAR Ambalaj Backend API Tests")
        print(f"🎯 Target URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test results tracking
        tests = [
            ("Authentication", self.test_authentication),
            ("Stock Statistics", self.test_stock_stats),
            ("Productions", self.test_productions),
            ("Materials", self.test_materials),
            ("Daily Consumption", self.test_daily_consumption),
            ("Cost Analysis", self.test_cost_analysis),
            ("Shipments", self.test_shipments),
            ("Cut Products", self.test_cut_products),
            ("Exchange Rates", self.test_exchange_rates),
            ("CORS Configuration", self.test_cors)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ {test_name}: Unexpected error - {str(e)}")
                failed += 1
        
        # Summary
        print("\n" + "=" * 60)
        print("📋 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📊 Total: {passed + failed}")
        
        if failed == 0:
            print("\n🎉 All tests passed! Backend is fully functional.")
            return True
        else:
            print(f"\n⚠️  {failed} test(s) failed. Please check the issues above.")
            return False

def main():
    """Main test execution"""
    tester = BackendTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()