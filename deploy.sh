#!/bin/bash

# XMenity Social Token Factory - Deployment Script
# Supports multiple deployment platforms after Express.js to Next.js migration

set -e

echo "🚀 XMenity Social Token Factory Deployment"
echo "=========================================="

# Check if environment variables are set
check_env() {
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL environment variable is required"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        echo "❌ JWT_SECRET environment variable is required"
        exit 1
    fi
    
    echo "✅ Environment variables check passed"
}

# Build the application
build_app() {
    echo "📦 Building the application..."
    
    # Generate Prisma client
    echo "🔧 Generating Prisma client..."
    npx prisma generate
    
    # Build Next.js application
    echo "🏗️ Building Next.js application..."
    npm run build
    
    echo "✅ Build completed successfully"
}

# Run database migrations
setup_database() {
    echo "🗄️ Setting up database..."
    
    # Deploy Prisma migrations
    echo "📊 Deploying database migrations..."
    npx prisma migrate deploy
    
    echo "✅ Database setup completed"
}

# Health check with robust polling
health_check() {
    echo "🩺 Running health check..."
    
    # Start the application in background for health check
    npm start &
    APP_PID=$!
    
    # Poll the health endpoint until it succeeds or times out
    echo "⏳ Waiting for application to start..."
    for i in {1..30}; do
        if node healthcheck.js; then
            echo "✅ Health check passed"
            kill $APP_PID 2>/dev/null || true
            return 0
        fi
        echo "  Attempt $i/30 - waiting..."
        sleep 2
    done
    
    echo "❌ Health check failed: Application did not respond in time."
    kill $APP_PID 2>/dev/null || true
    exit 1
}

# Platform-specific deployment
deploy_netlify() {
    echo "🌐 Deploying to Netlify..."
    
    # Use npx to avoid global installation issues
    echo "📦 Using Netlify CLI via npx..."
    npx netlify-cli deploy --prod --dir=.next
    echo "✅ Deployed to Netlify successfully"
}

deploy_railway() {
    echo "🚂 Deploying to Railway..."
    
    # Use npx to avoid global installation issues
    echo "📦 Using Railway CLI via npx..."
    npx @railway/cli up
    echo "✅ Deployed to Railway successfully"
}

deploy_docker() {
    echo "🐳 Building Docker image..."
    
    # Build Docker image
    docker build -t xmenity-social-tokens .
    
    # Tag for deployment (customize as needed)
    docker tag xmenity-social-tokens:latest your-registry/xmenity-social-tokens:latest
    
    echo "✅ Docker image built successfully"
    echo "📝 Push to your registry: docker push your-registry/xmenity-social-tokens:latest"
}

# Main deployment function
main() {
    echo "Select deployment platform:"
    echo "1) Netlify (Recommended)"
    echo "2) Railway"
    echo "3) Docker"
    echo "4) Build only"
    echo "5) Health check only"
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            check_env
            build_app
            setup_database
            deploy_netlify
            ;;
        2)
            check_env
            build_app
            setup_database
            deploy_railway
            ;;
        3)
            check_env
            build_app
            setup_database
            deploy_docker
            ;;
        4)
            check_env
            build_app
            setup_database
            echo "✅ Build completed. Ready for manual deployment."
            ;;
        5)
            health_check
            ;;
        *)
            echo "❌ Invalid choice. Please select 1-5."
            exit 1
            ;;
    esac
    
    echo ""
    echo "🎉 Deployment process completed!"
    echo "📚 See NEXTJS_DEPLOYMENT_GUIDE.md for detailed instructions"
}

# Run main function
main "$@"