# Supabase Setup Guide

This guide will help you set up Supabase for the XMenity Tube Frontend project.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New project"
3. Choose your organization or create a new one
4. Fill in project details:
   - **Name**: `xmenity-tube` or `supabase-green-island`
   - **Database Password**: Generate a strong password
   - **Region**: Choose the region closest to your users
5. Click "Create new project"

## 2. Configure Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the migration to create all necessary tables and indexes

## 3. Set Up Environment Variables

Copy your project credentials from the Supabase dashboard:

1. Go to Settings → API
2. Copy the following values to your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 4. Configure Storage

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `uploads`
3. Set bucket permissions:
   - **Public**: Yes (for public file access)
   - **File size limit**: 5MB
   - **Allowed file types**: image/jpeg, image/png, image/gif, image/webp

## 5. Set Up Row Level Security (RLS)

The migration script already includes RLS policies, but you can customize them:

### User Policies
- Users can view and update their own profiles
- Public read access for verified users

### Token Policies
- Public read access for active tokens
- Creators can update their own tokens

### Analytics Policies
- Public read access for analytics data
- Authenticated users can insert events

## 6. Configure Authentication (Optional)

If you want to use Supabase Auth:

1. Go to Authentication → Settings
2. Configure your auth providers (email, OAuth, etc.)
3. Set up email templates and redirects

## 7. Test the Connection

Run this test query in the SQL Editor to verify everything is working:

```sql
-- Test query
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

You should see a count of 7 tables.

## 8. Deploy to Production

### For Vercel Deployment:
1. Add your environment variables to Vercel dashboard
2. Deploy your project
3. Supabase will automatically handle scaling and backups

### For Self-Hosted:
1. Consider using Supabase's Docker setup
2. Ensure your environment variables are properly configured
3. Set up SSL certificates for your domain

## 9. Monitoring and Maintenance

1. **Database Health**: Monitor in Supabase dashboard
2. **Storage Usage**: Check storage limits and usage
3. **API Limits**: Monitor API request quotas
4. **Backups**: Supabase automatically handles backups for paid plans

## Troubleshooting

### Connection Issues
- Verify your environment variables are correct
- Check that your database is running
- Ensure your IP is allowed (if using IP restrictions)

### RLS Errors
- Check that your policies are properly configured
- Verify user authentication is working
- Test policies in the SQL Editor

### Migration Issues
- Run migrations in the correct order
- Check for any foreign key constraint errors
- Verify all required extensions are enabled

## Migration from Firebase

If you're migrating from Firebase:

1. **Data Export**: Export your Firebase data
2. **Data Transform**: Convert Firebase document structure to SQL
3. **Data Import**: Use Supabase's import tools or write custom scripts
4. **Test Thoroughly**: Verify all functionality works with Supabase

## Security Best Practices

1. **Environment Variables**: Never commit secrets to git
2. **RLS Policies**: Always enable and test RLS policies
3. **API Keys**: Use service role key only on server-side
4. **CORS**: Configure CORS properly for your domain
5. **SSL**: Always use HTTPS in production

## Performance Optimization

1. **Indexes**: The migration includes optimized indexes
2. **Connection Pooling**: Supabase handles this automatically
3. **Caching**: Consider implementing client-side caching
4. **Query Optimization**: Use `.select()` to limit returned fields

For more detailed information, refer to the [Supabase Documentation](https://supabase.com/docs).