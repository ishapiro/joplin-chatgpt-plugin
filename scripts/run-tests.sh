#!/bin/bash

# Comprehensive test runner script for ChatGPT Toolkit Plugin
set -e

echo "🧪 ChatGPT Toolkit Plugin - Comprehensive Test Suite"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Check if dist directory exists and build if needed
if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
    print_warning "Compiled code not found. Building project..."
    npm run build
fi

# Clean previous test artifacts
print_status "Cleaning previous test artifacts..."
rm -rf coverage/
rm -rf .nyc_output/
rm -f test-results.json

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Run different test suites
print_status "Running test suites..."

# 1. Basic functionality tests
echo ""
echo "📋 Running Basic Tests..."
npx jest test/simple.test.js --verbose --coverage=false

# 2. Plugin integration tests
echo ""
echo "🔌 Running Plugin Integration Tests..."
npx jest test/plugin.test.js --verbose --coverage=false

# 3. Unit tests for ChatGPTAPI
echo ""
echo "⚙️  Running ChatGPTAPI Unit Tests..."
npx jest test/chatgpt-api.test.js --verbose --coverage=false

# 4. Integration tests
echo ""
echo "🔗 Running Integration Tests..."
npx jest test/integration.test.js --verbose --coverage=false

# 5. Error handling tests
echo ""
echo "🚨 Running Error Handling Tests..."
npx jest test/error-handling.test.js --verbose --coverage=false

# 6. Performance tests
echo ""
echo "⚡ Running Performance Tests..."
npx jest test/performance.test.js --verbose --coverage=false

# 7. Run all tests with coverage
echo ""
echo "📊 Running All Tests with Coverage Analysis..."
npx jest --coverage --coverageReporters=text --coverageReporters=html --coverageReporters=json-summary

# Generate coverage summary
if [ -f "coverage/coverage-summary.json" ]; then
    echo ""
    echo "📈 Coverage Summary:"
    echo "==================="
    
    # Extract coverage percentages using node
    node -e "
    const fs = require('fs');
    const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
    const total = coverage.total;
    
    console.log('Lines:      ' + total.lines.pct + '%');
    console.log('Functions:  ' + total.functions.pct + '%');
    console.log('Branches:   ' + total.branches.pct + '%');
    console.log('Statements: ' + total.statements.pct + '%');
    
    // Check if coverage meets thresholds
    const thresholds = {
        lines: 75,
        functions: 75,
        branches: 70,
        statements: 75
    };
    
    let allPassed = true;
    Object.keys(thresholds).forEach(key => {
        if (total[key].pct < thresholds[key]) {
            console.log('❌ ' + key + ' coverage (' + total[key].pct + '%) below threshold (' + thresholds[key] + '%)');
            allPassed = false;
        } else {
            console.log('✅ ' + key + ' coverage (' + total[key].pct + '%) meets threshold (' + thresholds[key] + '%)');
        }
    });
    
    if (allPassed) {
        console.log('\\n🎉 All coverage thresholds met!');
        process.exit(0);
    } else {
        console.log('\\n⚠️  Some coverage thresholds not met');
        process.exit(1);
    }
    "
else
    print_warning "Coverage summary not generated"
fi

# Check for test artifacts
if [ -d "coverage" ]; then
    print_success "Coverage report generated in coverage/ directory"
    if command -v open &> /dev/null; then
        echo "Opening coverage report..."
        open coverage/index.html
    elif command -v xdg-open &> /dev/null; then
        echo "Opening coverage report..."
        xdg-open coverage/index.html
    else
        print_status "Coverage report available at coverage/index.html"
    fi
fi

echo ""
echo "🏁 Test suite completed!"
echo ""
echo "Next steps:"
echo "- Review coverage report in coverage/index.html"
echo "- Address any failing tests or low coverage areas"
echo "- Run 'npm test' for quick test execution"
echo "- Run 'npm run test:watch' for development mode"
